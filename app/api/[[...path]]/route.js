import { NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// In-memory rate limiting (fallback when Supabase not configured)
const rateLimitStore = new Map()

// Rate limit configuration
const RATE_LIMITS = {
  anonymous: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  free: { max: 10, windowMs: 60 * 60 * 1000 },     // 10 per hour
  premium: { max: 1000, windowMs: 60 * 60 * 1000 } // Unlimited essentially
}

// System prompt for Butterfly.gov analysis
const SYSTEM_PROMPT = `Rôle :
Tu es le moteur logique de "Butterfly.gov", un simulateur macro-économique, sociologique et environnemental ultra-avancé. Ton rôle est de calculer de manière clinique, neutre et objective les conséquences de la loi ou mesure politique proposée par l'utilisateur.

Règles absolues (Garde-fous) :

Neutralité totale : N'émets JAMAIS de jugement de valeur. N'utilise pas de mots comme "bien", "mal", "juste", "injuste", "dangereux" ou "humaniste". Tu ne fais pas la morale. Tu énonces des mécanismes de cause à effet.

Réalisme cynique : Base tes prévisions sur la théorie des jeux, l'économie comportementale et l'histoire. Si une loi crée une faille, les gens l'exploiteront. Prends en compte les effets de bord (fuite des capitaux, marché noir, inflation, etc.).

Format strict : Tu DOIS répondre UNIQUEMENT par un objet JSON valide, sans aucun texte avant ou après.

Structure du JSON attendu :

{
  "winners": "Description factuelle et concise de la catégorie de population ou secteur qui tirera un bénéfice direct et mesurable de cette mesure (max 15 mots).",
  "losers": "Description factuelle et concise de ceux qui paieront le coût direct ou perdront des avantages (max 15 mots).",
  "butterfly_effect": "Prévision d'une conséquence secondaire inattendue, ironique ou systémique à un horizon de 5 ans. Sois percutant (max 20 mots).",
  "scores": {
    "economy": [Entier de 0 à 100 estimant la santé financière globale, le PIB et l'emploi],
    "social": [Entier de 0 à 100 estimant la paix sociale, la réduction des inégalités et la santé publique],
    "ecology": [Entier de 0 à 100 estimant l'impact sur le climat, la biodiversité et les ressources]
  }
}`

// System prompt for "L'Opposant Féroce" - Premium Debate Chat
const DEBATE_CHAT_PROMPT = `Tu es "L'Opposant Féroce", un débatteur politique, macro-économiste et sociologue brillant, cynique et impitoyable. L'utilisateur vient de proposer une loi. Ton but n'est pas de l'aider, mais de la détruire argumentativement.

Ton ton : Piquant, sarcastique, hyper-rationnel, un brin arrogant mais sans jamais utiliser d'insultes. Tu parles comme un expert de plateau télé qui vient de trouver une faille béante dans le raisonnement de son adversaire.

Ta méthode : Attaque immédiatement sur les angles morts (financement introuvable, fuite des capitaux, injustice sociale cachée, désastre écologique imprévu).

Ton objectif : Pousse l'utilisateur dans ses retranchements. S'il te donne un bon argument ou amende sa loi intelligemment, concède le point à contrecœur et recalcule son score global à la hausse. S'il répond de manière démagogique, effondre son score et sois implacable.

IMPORTANT - Tu dois TOUJOURS terminer ta réponse par un objet JSON sur une nouvelle ligne avec ce format exact:
{"score_adjustment": X, "new_scores": {"economy": Y, "social": Z, "ecology": W}}
où X est un nombre entre -15 et +15 représentant l'ajustement du score global basé sur la qualité de l'argument.

Format de réponse : Des réponses courtes (max 3 paragraphes). Termine toujours par une question rhétorique ou un défi direct pour forcer l'utilisateur à répondre, PUIS le JSON d'ajustement de score.`

// Get client IP address
function getClientIP(request) {
  const headersList = headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIP = headersList.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

// Check rate limit (with Supabase or in-memory fallback)
async function checkRateLimit(identifier, identifierType, userTier = 'anonymous') {
  const supabase = createServiceClient()
  const limits = RATE_LIMITS[userTier]
  const windowStart = new Date(Date.now() - limits.windowMs)
  
  // Use Supabase if configured
  if (supabase) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .eq('identifier_type', identifierType)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Rate limit fetch error:', fetchError)
        return { allowed: true, remaining: limits.max, resetAt: new Date(Date.now() + limits.windowMs) }
      }
      
      if (!existing) {
        await supabase.from('rate_limits').insert({
          identifier,
          identifier_type: identifierType,
          request_count: 1,
          window_start: new Date()
        })
        return { allowed: true, remaining: limits.max - 1, resetAt: new Date(Date.now() + limits.windowMs) }
      }
      
      const windowStartTime = new Date(existing.window_start)
      
      if (windowStartTime < windowStart) {
        await supabase
          .from('rate_limits')
          .update({ request_count: 1, window_start: new Date() })
          .eq('identifier', identifier)
          .eq('identifier_type', identifierType)
        return { allowed: true, remaining: limits.max - 1, resetAt: new Date(Date.now() + limits.windowMs) }
      }
      
      if (existing.request_count >= limits.max) {
        const resetAt = new Date(windowStartTime.getTime() + limits.windowMs)
        return { 
          allowed: false, 
          remaining: 0, 
          resetAt,
          message: userTier === 'anonymous' 
            ? 'Vous avez épuisé vos 5 tests gratuits. Créez un compte gratuit pour obtenir 5 tests supplémentaires par heure, ou passez Premium pour débloquer le Mode Débat.'
            : 'Vous avez atteint votre limite de tests. Passez Premium pour un accès illimité.'
        }
      }
      
      await supabase
        .from('rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('identifier', identifier)
        .eq('identifier_type', identifierType)
      
      return { allowed: true, remaining: limits.max - existing.request_count - 1, resetAt: new Date(windowStartTime.getTime() + limits.windowMs) }
    } catch (err) {
      console.error('Supabase rate limit error:', err)
    }
  }
  
  // Fallback: In-memory rate limiting
  const key = `${identifierType}:${identifier}`
  const now = Date.now()
  let record = rateLimitStore.get(key)
  
  if (!record || record.windowStart < windowStart.getTime()) {
    record = { count: 1, windowStart: now }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: limits.max - 1, resetAt: new Date(now + limits.windowMs) }
  }
  
  if (record.count >= limits.max) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: new Date(record.windowStart + limits.windowMs),
      message: userTier === 'anonymous' 
        ? 'Vous avez épuisé vos 5 tests gratuits. Créez un compte gratuit pour obtenir 5 tests supplémentaires par heure, ou passez Premium pour débloquer le Mode Débat.'
        : 'Vous avez atteint votre limite de tests. Passez Premium pour un accès illimité.'
    }
  }
  
  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true, remaining: limits.max - record.count, resetAt: new Date(record.windowStart + limits.windowMs) }
}

// Get user from auth header
async function getUser(request) {
  const supabase = createServiceClient()
  if (!supabase) return null
  
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return { ...user, profile }
}

// Analyze law with Claude
async function analyzeLaw(law) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY non configurée. Ajoutez-la dans votre fichier .env')
  }

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
  
  const { text } = await generateText({
    model: anthropic('Claude-3-haiku-20241022'),
    system: SYSTEM_PROMPT,
    prompt: `Analyse cette proposition de loi: "${law.trim()}"`,
    maxTokens: 1024,
  })
  
  const cleanedText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  
  const analysis = JSON.parse(cleanedText)
  
  analysis.scores = {
    economy: Math.max(0, Math.min(100, analysis.scores.economy || 50)),
    social: Math.max(0, Math.min(100, analysis.scores.social || 50)),
    ecology: Math.max(0, Math.min(100, analysis.scores.ecology || 50))
  }
  
  analysis.scores.overall = Math.round(
    (analysis.scores.economy + analysis.scores.social + analysis.scores.ecology) / 3
  )
  
  return analysis
}

// Save law to history
async function saveLawToHistory(law, analysis, userId, ipAddress, isDebate = false) {
  const supabase = createServiceClient()
  if (!supabase) return // Skip if not configured
  
  try {
    await supabase.from('laws_history').insert({
      user_id: userId,
      ip_address: ipAddress,
      law_text: law,
      winners: analysis.winners,
      losers: analysis.losers,
      butterfly_effect: analysis.butterfly_effect,
      score_economy: analysis.scores.economy,
      score_social: analysis.scores.social,
      score_ecology: analysis.scores.ecology,
      score_overall: analysis.scores.overall,
      is_debate: isDebate
    })
  } catch (err) {
    console.error('Save history error:', err)
  }
}

// Handle OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Main POST handler
export async function POST(request, { params }) {
  try {
    const path = params?.path || []
    const endpoint = path.join('/')
    
    if (endpoint === 'analyze') {
      return handleAnalyze(request)
    }
    
    if (endpoint === 'debate') {
      return handleDebate(request)
    }
    
    if (endpoint === 'debate-chat') {
      return handleDebateChat(request)
    }
    
    if (endpoint === 'stripe/create-checkout') {
      return handleCreateCheckout(request)
    }
    
    if (endpoint === 'stripe/webhook') {
      return handleStripeWebhook(request)
    }
    
    if (endpoint === 'stripe/portal') {
      return handleStripePortal(request)
    }
    
    return NextResponse.json(
      { error: 'Endpoint not found' },
      { status: 404, headers: corsHeaders }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET handler
export async function GET(request, { params }) {
  const path = params?.path || []
  const endpoint = path.join('/')
  
  if (endpoint === 'health') {
    return NextResponse.json({ status: 'ok', service: 'Butterfly.gov' }, { headers: corsHeaders })
  }
  
  if (endpoint === 'history') {
    return handleGetHistory(request)
  }
  
  if (endpoint === 'leaderboard') {
    return handleGetLeaderboard(request)
  }
  
  if (endpoint === 'me') {
    return handleGetMe(request)
  }
  
  if (endpoint === 'rate-limit-status') {
    return handleGetRateLimitStatus(request)
  }
  
  return NextResponse.json({ message: 'Butterfly.gov API' }, { headers: corsHeaders })
}

// Analyze single law
async function handleAnalyze(request) {
  const body = await request.json()
  const { law } = body
  
  if (!law || typeof law !== 'string' || law.trim().length === 0) {
    return NextResponse.json({ error: 'Le champ "law" est requis' }, { status: 400, headers: corsHeaders })
  }
  
  const user = await getUser(request)
  const ipAddress = getClientIP(request)
  
  let userTier = 'anonymous'
  let identifier = ipAddress
  let identifierType = 'ip'
  
  if (user) {
    identifierType = 'user'
    identifier = user.id
    userTier = user.profile?.is_premium ? 'premium' : 'free'
  }
  
  const rateLimit = await checkRateLimit(identifier, identifierType, userTier)
  
  if (!rateLimit.allowed) {
    return NextResponse.json({ 
      error: 'rate_limit_exceeded',
      message: rateLimit.message,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
      userTier
    }, { status: 429, headers: corsHeaders })
  }
  
  try {
    const analysis = await analyzeLaw(law)
    await saveLawToHistory(law, analysis, user?.id, ipAddress)
    
    return NextResponse.json({
      ...analysis,
      rateLimit: { remaining: rateLimit.remaining, resetAt: rateLimit.resetAt }
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Analysis Error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse: ' + error.message }, { status: 500, headers: corsHeaders })
  }
}

// Debate mode (Premium only)
async function handleDebate(request) {
  const user = await getUser(request)
  
  // In demo mode (no Supabase), allow debate for testing
  const supabase = createServiceClient()
  if (supabase && (!user || !user.profile?.is_premium)) {
    return NextResponse.json({ 
      error: 'premium_required',
      message: 'Le Mode Débat est réservé aux abonnés Premium. Abonnez-vous pour 2,99€/mois.'
    }, { status: 403, headers: corsHeaders })
  }
  
  const body = await request.json()
  const { law1, law2 } = body
  
  if (!law1 || !law2) {
    return NextResponse.json({ error: 'Les deux propositions de loi sont requises' }, { status: 400, headers: corsHeaders })
  }
  
  const ipAddress = getClientIP(request)
  
  try {
    const [analysis1, analysis2] = await Promise.all([analyzeLaw(law1), analyzeLaw(law2)])
    
    await Promise.all([
      saveLawToHistory(law1, analysis1, user?.id, ipAddress, true),
      saveLawToHistory(law2, analysis2, user?.id, ipAddress, true)
    ])
    
    return NextResponse.json({
      law1: { text: law1.trim(), analysis: analysis1 },
      law2: { text: law2.trim(), analysis: analysis2 }
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Debate Error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse: ' + error.message }, { status: 500, headers: corsHeaders })
  }
}

// Debate Chat with "L'Opposant Féroce" (Premium only)
async function handleDebateChat(request) {
  const user = await getUser(request)
  
  // Check premium access
  const supabase = createServiceClient()
  if (supabase && (!user || !user.profile?.is_premium)) {
    return NextResponse.json({ 
      error: 'premium_required',
      message: 'Le Mode Débat Chat est réservé aux abonnés Premium.'
    }, { status: 403, headers: corsHeaders })
  }
  
  const body = await request.json()
  const { law, messages, currentScores } = body
  
  if (!law || !messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400, headers: corsHeaders })
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500, headers: corsHeaders })
  }
  
  try {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
    
    // Build conversation context
    const systemWithContext = `${DEBATE_CHAT_PROMPT}

CONTEXTE DE LA LOI DÉBATTUE:
"${law}"

SCORES ACTUELS:
- Économie: ${currentScores?.economy || 50}/100
- Social: ${currentScores?.social || 50}/100
- Écologie: ${currentScores?.ecology || 50}/100
- Score Global: ${currentScores?.overall || 50}/100

Tu dois ajuster ces scores en fonction de la qualité des arguments de l'utilisateur.`
    
    // Format messages for Claude
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }))
    
    const { text } = await generateText({
      model: anthropic('Claude-3-haiku-20241022'),
      system: systemWithContext,
      messages: formattedMessages,
      maxTokens: 1024,
    })
    
    // Extract score adjustment from response
    let responseText = text
    let scoreAdjustment = null
    
    // Try to extract JSON from the end of the response
    const jsonMatch = text.match(/\{"score_adjustment":\s*(-?\d+),\s*"new_scores":\s*\{[^}]+\}\}/s)
    if (jsonMatch) {
      try {
        scoreAdjustment = JSON.parse(jsonMatch[0])
        responseText = text.replace(jsonMatch[0], '').trim()
      } catch (e) {
        console.error('Failed to parse score adjustment:', e)
      }
    }
    
    return NextResponse.json({
      response: responseText,
      scoreAdjustment: scoreAdjustment
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Debate Chat Error:', error)
    return NextResponse.json({ error: 'Erreur lors du débat: ' + error.message }, { status: 500, headers: corsHeaders })
  }
}

// Get history
async function handleGetHistory(request) {
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ history: [] }, { headers: corsHeaders })
  }
  
  const user = await getUser(request)
  
  let query = supabase
    .from('laws_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (user) {
    query = query.eq('user_id', user.id)
  }
  
  const { data: history, error } = await query
  
  if (error) {
    console.error('History Error:', error)
    return NextResponse.json({ history: [] }, { headers: corsHeaders })
  }
  
  return NextResponse.json({ history }, { headers: corsHeaders })
}

// Get leaderboard
async function handleGetLeaderboard(request) {
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ leaderboard: { economy: [], social: [], ecology: [], overall: [] } }, { headers: corsHeaders })
  }
  
  const [topEconomy, topSocial, topEcology, topOverall] = await Promise.all([
    supabase.from('laws_history').select('law_text, score_economy').order('score_economy', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_social').order('score_social', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_ecology').order('score_ecology', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_overall').order('score_overall', { ascending: false }).limit(5)
  ])
  
  return NextResponse.json({
    leaderboard: {
      economy: (topEconomy.data || []).map(h => ({ law: h.law_text, score: h.score_economy })),
      social: (topSocial.data || []).map(h => ({ law: h.law_text, score: h.score_social })),
      ecology: (topEcology.data || []).map(h => ({ law: h.law_text, score: h.score_ecology })),
      overall: (topOverall.data || []).map(h => ({ law: h.law_text, score: h.score_overall }))
    }
  }, { headers: corsHeaders })
}

// Get current user
async function handleGetMe(request) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ user: null }, { headers: corsHeaders })
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, profile: user.profile }
  }, { headers: corsHeaders })
}

// Get rate limit status
async function handleGetRateLimitStatus(request) {
  const user = await getUser(request)
  const ipAddress = getClientIP(request)
  
  let userTier = 'anonymous'
  let identifier = ipAddress
  let identifierType = 'ip'
  
  if (user) {
    identifierType = 'user'
    identifier = user.id
    userTier = user.profile?.is_premium ? 'premium' : 'free'
  }
  
  const limits = RATE_LIMITS[userTier]
  return NextResponse.json({
    userTier,
    max: limits.max,
    remaining: limits.max,
    resetAt: new Date(Date.now() + limits.windowMs)
  }, { headers: corsHeaders })
}

// Stripe: Create checkout session
async function handleCreateCheckout(request) {
  const user = await getUser(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Vous devez être connecté pour vous abonner' }, { status: 401, headers: corsHeaders })
  }
  
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PREMIUM_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY et STRIPE_PREMIUM_PRICE_ID dans .env' }, { status: 500, headers: corsHeaders })
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createServiceClient()
  
  let customerId = user.profile?.stripe_customer_id
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id }
    })
    customerId = customer.id
    
    if (supabase) {
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }
  }
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}?canceled=true`,
    metadata: { user_id: user.id }
  })
  
  return NextResponse.json({ url: session.url }, { headers: corsHeaders })
}

// Stripe: Customer portal
async function handleStripePortal(request) {
  const user = await getUser(request)
  
  if (!user || !user.profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 400, headers: corsHeaders })
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500, headers: corsHeaders })
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const session = await stripe.billingPortal.sessions.create({
    customer: user.profile.stripe_customer_id,
    return_url: process.env.NEXT_PUBLIC_BASE_URL
  })
  
  return NextResponse.json({ url: session.url }, { headers: corsHeaders })
}

// Stripe: Webhook handler
async function handleStripeWebhook(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhooks non configurés' }, { status: 500 })
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ received: true, warning: 'Supabase not configured' })
  }
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const subscriptionId = session.subscription
      
      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await supabase.from('profiles').update({
          is_premium: true,
          stripe_subscription_id: subscriptionId,
          premium_until: new Date(subscription.current_period_end * 1000)
        }).eq('id', userId)
      }
      break
    } 
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = subscription.customer
      
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      
      if (profile) {
        const isActive = subscription.status === 'active'
        await supabase.from('profiles').update({
          is_premium: isActive,
          premium_until: isActive ? new Date(subscription.current_period_end * 1000) : null
        }).eq('id', profile.id)
      }
      break
    }
  }
  
  return NextResponse.json({ received: true })
}
