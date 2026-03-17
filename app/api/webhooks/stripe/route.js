export const runtime = 'nodejs' // Stripe webhook requires Node runtime (not edge)

import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Webhook] STRIPE_SECRET_KEY non configurée')
    return new Response('Stripe not configured', { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  // Lire le raw body — INDISPENSABLE pour la vérification de signature Stripe
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event

  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('[Webhook] Signature invalide:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }
  } else {
    // Fallback dev sans STRIPE_WEBHOOK_SECRET (ne pas utiliser en prod)
    try {
      event = JSON.parse(body)
      console.warn('[Webhook] Vérification de signature désactivée — mode développement')
    } catch {
      return new Response('Corps invalide', { status: 400 })
    }
  }

  const supabase = createServiceClient()

  if (!supabase) {
    console.error('[Webhook] Supabase non configuré')
    // Retourner 200 pour éviter les retries Stripe
    return new Response(JSON.stringify({ received: true, warning: 'Supabase non configuré' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    switch (event.type) {

      // ── Paiement réussi : activer le premium ───────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const customerId = session.customer
        const subscriptionId = session.subscription

        if (!userId) {
          console.error('[Webhook] checkout.session.completed sans user_id dans metadata')
          break
        }

        // Récupérer la date de fin de période depuis l'abonnement
        let premiumUntil = null
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          premiumUntil = new Date(sub.current_period_end * 1000).toISOString()
        } catch (err) {
          console.error('[Webhook] Impossible de récupérer l\'abonnement:', err.message)
        }

        await supabase.from('profiles').update({
          is_premium: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          premium_until: premiumUntil,
        }).eq('id', userId)

        console.log(`[Webhook] checkout.session.completed → user ${userId} est maintenant Premium`)
        break
      }

      // ── Abonnement annulé : révoquer le premium ────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await supabase.from('profiles')
          .update({ is_premium: false, premium_until: null })
          .eq('stripe_customer_id', subscription.customer)
        console.log(`[Webhook] subscription.deleted → customer ${subscription.customer} rétrogradé`)
        break
      }

      // ── Abonnement mis à jour (impayé, reprise, etc.) ──────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const activeStatuses = ['active', 'trialing']
        const isActive = activeStatuses.includes(subscription.status)
        const premiumUntil = isActive
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        await supabase.from('profiles')
          .update({ is_premium: isActive, premium_until: premiumUntil })
          .eq('stripe_customer_id', subscription.customer)

        console.log(`[Webhook] subscription.updated → customer ${subscription.customer} status=${subscription.status} is_premium=${isActive}`)
        break
      }

      // ── Paiement de facture échoué : log monitoring ────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.error(`[Webhook] invoice.payment_failed → customer ${invoice.customer} montant ${invoice.amount_due / 100}€`)
        // Optionnel : marquer le profil (ici on log seulement)
        break
      }

      default:
        console.log(`[Webhook] Événement non géré : ${event.type}`)
    }
  } catch (err) {
    console.error('[Webhook] Erreur de traitement:', err)
    // Toujours retourner 200 — Stripe retry sur les erreurs 5xx
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function GET() {
  return new Response('Webhook Stripe — méthode GET non supportée', { status: 405 })
}
