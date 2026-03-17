import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Crée et retourne un client Stripe configuré.
 * Lève une erreur si STRIPE_SECRET_KEY n'est pas configuré.
 */
export function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY non configurée')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

/**
 * Vérifie si un utilisateur est premium dans Supabase.
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<boolean>}
 */
export async function isPremium(userId) {
  if (!userId) return false
  const supabase = createServiceClient()
  if (!supabase) return false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single()
    return profile?.is_premium === true
  } catch {
    return false
  }
}
