import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createShare } from '@/lib/share'

// ── Modèles Claude configurables via variables d'environnement ──────────────
// CLAUDE_MODEL_FREE    → modèle pour les utilisateurs anonymes/gratuits
// CLAUDE_MODEL_PREMIUM → modèle pour les utilisateurs premium
// Par défaut : haiku pour les deux (économique et rapide)
const MODEL_FREE    = process.env.CLAUDE_MODEL_FREE    || 'claude-haiku-4-5-20251001'
const MODEL_PREMIUM = process.env.CLAUDE_MODEL_PREMIUM || 'claude-haiku-4-5-20251001'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// In-memory rate limiting (fallback when Supabase not configured)
const rateLimitStore = new Map()

// Rate limit configuration (analyze) — rolling 24h window
const RATE_LIMITS = {
  anonymous: { max: 2,    windowMs: 24 * 60 * 60 * 1000 }, // 2 per day
  free:      { max: 5,    windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
  premium:   { max: 1000, windowMs: 24 * 60 * 60 * 1000 }  // Unlimited
}

// Rate limit configuration (debate chat messages — free users)
const DEBATE_CHAT_LIMITS = {
  free:    { max: 10,   windowMs: 60 * 60 * 1000 }, // 10 messages/h
  premium: { max: 1000, windowMs: 60 * 60 * 1000 }  // Unlimited
}

// Dynamic current year (avoids hardcoded dates)
const CURRENT_YEAR = new Date().getFullYear()

// ── Continuation helper ────────────────────────────────────────────────────
// Claude can truncate long responses (stop_reason === 'max_tokens').
// This helper retries up to MAX_LOOPS times to get the complete text.
const MAX_CONTINUATION_LOOPS = 3

async function getCompleteMessage(client, params) {
  let fullText = ''
  let messages = [...params.messages]
  let loopCount = 0

  while (loopCount < MAX_CONTINUATION_LOOPS) {
    const response = await client.messages.create({ ...params, messages })
    const chunk = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    fullText += chunk

    if (response.stop_reason !== 'max_tokens') break

    // Append partial response and ask Claude to continue
    messages = [
      ...messages,
      { role: 'assistant', content: chunk },
      { role: 'user', content: 'Continue exactement où tu t\'es arrêté, sans répéter ce qui a déjà été dit.' }
    ]
    loopCount++
  }

  return fullText
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
    "ecology": [Entier de 0 à 100 estimant l'impact sur le climat, la biodiversité et les ressources],
    "faisabilite": [Entier de 0 à 100 estimant la faisabilité réelle: budget disponible, consensus politique possible, complexité réglementaire, délai de mise en œuvre]
  }
}

Contexte temporel : Nous sommes en ${CURRENT_YEAR}. Tiens compte du contexte économique et politique actuel.`

// System prompt for "L'Opposant Féroce" - Premium Debate Chat
const DEBATE_CHAT_PROMPT = `Tu es "L'Opposant Féroce", un débatteur politique, macro-économiste et sociologue brillant, cynique et impitoyable.

Ton ton : Piquant, sarcastique, hyper-rationnel, un brin arrogant mais sans jamais utiliser d'insultes. Tu parles comme un expert de plateau télé qui vient de trouver une faille béante dans le raisonnement de son adversaire.

Ta méthode : Attaque sur les angles morts spécifiques à la loi proposée (financement, effets pervers, injustice cachée, désastre écologique imprévu). Tes critiques doivent être précises et liées à la loi, pas génériques.

Ton objectif : Pousser l'utilisateur dans ses retranchements. S'il donne un bon argument sourcé ou amende sa loi intelligemment, concède à contrecœur et monte le score. S'il répond de façon vague ou démagogique, sois implacable et baisse le score.

RÈGLES DE SCORING (applique-les RIGOUREUSEMENT — les erreurs de calcul sont inacceptables):
- Les scores economy, social, ecology, faisabilite sont des entiers entre 0 et 100
- Chaque échange : ajustement maximum de -8 à +8 sur les dimensions concernées
- Ajuste UNIQUEMENT la dimension liée à l'argument (économique → economy, social → social, écolo → ecology, faisabilité/budget/délai → faisabilite)
- Les nouvelles valeurs = valeurs actuelles + ajustement, jamais en dehors de [0, 100]
- score_adjustment global = moyenne des ajustements appliqués
- Si l'argument est hors sujet ou vague : score_adjustment = 0, scores inchangés

IMPORTANT — Termine TOUJOURS ta réponse par ce JSON sur une nouvelle ligne, rien après:
{"score_adjustment": X, "new_scores": {"economy": Y, "social": Z, "ecology": W, "faisabilite": V}}

Format de réponse : 2-3 paragraphes maximum. Termine par une question rhétorique ou un défi direct, PUIS le JSON.`

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
            ? 'Vous avez épuisé vos 2 analyses gratuites du jour. Créez un compte pour obtenir 5 analyses par jour, ou passez Premium pour un accès illimité.'
            : 'Vous avez utilisé vos 5 analyses du jour. Revenez demain ou passez Premium pour un accès illimité.'
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
        ? 'Vous avez épuisé vos 2 analyses gratuites du jour. Créez un compte pour obtenir 5 analyses par jour, ou passez Premium pour un accès illimité.'
        : 'Vous avez utilisé vos 5 analyses du jour. Revenez demain ou passez Premium pour un accès illimité.'
    }
  }

  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true, remaining: limits.max - record.count, resetAt: new Date(record.windowStart + limits.windowMs) }
}

// Rate limit for debate chat messages (separate bucket, prefix dc:)
async function checkDebateChatRateLimit(userId, userTier) {
  if (userTier === 'premium') {
    return { allowed: true, remaining: 999, resetAt: new Date(Date.now() + 3600000) }
  }
  const limits = DEBATE_CHAT_LIMITS.free
  const dcId = `dc:${userId}`
  const windowMs = limits.windowMs
  const supabase = createServiceClient()

  if (supabase) {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('rate_limits').select('*')
        .eq('identifier', dcId).eq('identifier_type', 'user').single()

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        // DB error → allow through
        return { allowed: true, remaining: limits.max, resetAt: new Date(Date.now() + windowMs) }
      }

      const now = new Date()
      const windowStart = new Date(Date.now() - windowMs)

      if (!existing) {
        await supabase.from('rate_limits').insert({ identifier: dcId, identifier_type: 'user', request_count: 1, window_start: now })
        return { allowed: true, remaining: limits.max - 1, resetAt: new Date(Date.now() + windowMs) }
      }

      if (new Date(existing.window_start) < windowStart) {
        await supabase.from('rate_limits').update({ request_count: 1, window_start: now })
          .eq('identifier', dcId).eq('identifier_type', 'user')
        return { allowed: true, remaining: limits.max - 1, resetAt: new Date(Date.now() + windowMs) }
      }

      if (existing.request_count >= limits.max) {
        const resetAt = new Date(new Date(existing.window_start).getTime() + windowMs)
        return { allowed: false, remaining: 0, resetAt, message: `Vous avez utilisé vos ${limits.max} messages de débat gratuits cette heure. Passez Premium pour débattre sans limite !` }
      }

      await supabase.from('rate_limits').update({ request_count: existing.request_count + 1 })
        .eq('identifier', dcId).eq('identifier_type', 'user')
      return { allowed: true, remaining: limits.max - existing.request_count - 1, resetAt: new Date(new Date(existing.window_start).getTime() + windowMs) }
    } catch (err) {
      console.error('Debate chat rate limit error:', err)
    }
  }

  // In-memory fallback
  const key = `dc:user:${userId}`
  const now = Date.now()
  let record = rateLimitStore.get(key)
  if (!record || record.windowStart < now - windowMs) {
    record = { count: 1, windowStart: now }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: limits.max - 1, resetAt: new Date(now + windowMs) }
  }
  if (record.count >= limits.max) {
    return { allowed: false, remaining: 0, resetAt: new Date(record.windowStart + windowMs), message: `Vous avez utilisé vos ${limits.max} messages de débat gratuits cette heure. Passez Premium pour débattre sans limite !` }
  }
  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true, remaining: limits.max - record.count, resetAt: new Date(record.windowStart + windowMs) }
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

// Analyze law with claude
async function analyzeLaw(law) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY non configurée.')
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: MODEL_FREE,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Analyse cette proposition de loi: "${law.trim()}"` }]
  })
  const text = message.content[0].text
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Réponse invalide de l\'IA')
  const analysis = JSON.parse(jsonMatch[0])
  const clamp = (v, d = 50) => Math.max(0, Math.min(100, Math.round(v ?? d)))
  analysis.scores = {
    economy:     clamp(analysis.scores.economy),
    social:      clamp(analysis.scores.social),
    ecology:     clamp(analysis.scores.ecology),
    faisabilite: clamp(analysis.scores.faisabilite)
  }
  analysis.scores.overall = Math.round((analysis.scores.economy + analysis.scores.social + analysis.scores.ecology + analysis.scores.faisabilite) / 4)
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
    
    if (endpoint === 'debate-chat') {
      return handleDebateChat(request)
    }

    if (endpoint === 'share') {
      return handleCreateShare(request)
    }
    
    if (endpoint === 'stripe/create-checkout') {
      return handleCreateCheckout(request)
    }

    if (endpoint === 'stripe/cancel-subscription') {
      return handleCancelSubscription(request)
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

// Debate Chat with "L'Opposant Féroce" (Free with limit / Premium unlimited)
async function handleDebateChat(request) {
  const user = await getUser(request)

  // Require authentication (no anonymous access)
  if (!user) {
    return NextResponse.json({
      error: 'auth_required',
      message: 'Connectez-vous pour accéder au Débat IA.'
    }, { status: 401, headers: corsHeaders })
  }

  const body = await request.json()
  const { law, law1, law2, selectedLaws, messages, currentScores, law1Scores, law2Scores, summarize, firstMessage } = body

  // Rate limit only actual chat messages (not firstMessage greeting or summarize)
  if (!firstMessage && !summarize) {
    const userTier = user.profile?.is_premium ? 'premium' : 'free'
    const rateLimit = await checkDebateChatRateLimit(user.id, userTier)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'rate_limit_exceeded',
        message: rateLimit.message,
        remaining: 0,
        resetAt: rateLimit.resetAt,
        userTier
      }, { status: 429, headers: corsHeaders })
    }
  }

  if (!firstMessage && (!messages || !Array.isArray(messages))) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400, headers: corsHeaders })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500, headers: corsHeaders })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    // --- FIRST MESSAGE MODE ---
    if (firstMessage) {
      const lawCtx = selectedLaws === 'both' && law1 && law2
        ? `LOI A : "${law1}" ET LOI B : "${law2}" (deux lois à attaquer)`
        : `"${law || law1}"`

      const firstMsgSystem = `Tu es "L'Opposant Féroce", un débatteur politique brillant, sarcastique et impitoyable.
Génère un message d'ouverture percutant (2 paragraphes max) pour attaquer cette proposition : ${lawCtx}.
- Identifie LA faille principale SPÉCIFIQUE à cette loi précise (pas une critique générique)
- Sois sarcastique, piquant, expert — pas vulgaire
- Termine OBLIGATOIREMENT par une question rhétorique directe qui force l'utilisateur à se défendre
- Pas de JSON, juste le texte d'ouverture`

      const firstText = await getCompleteMessage(client, {
        model: MODEL_FREE,
        max_tokens: 1200,
        system: firstMsgSystem,
        messages: [{ role: 'user', content: 'Commence le débat.' }],
      })
      return NextResponse.json({ firstMessage: firstText }, { headers: corsHeaders })
    }

    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }))

    // --- SUMMARY MODE ---
    if (summarize) {
      const isDebate = !!(law1 && law2)
      const sc1 = law1Scores || currentScores || { economy: 50, social: 50, ecology: 50, faisabilite: 50 }
      const sc2 = law2Scores || currentScores || { economy: 50, social: 50, ecology: 50, faisabilite: 50 }
      const sc0 = currentScores || { economy: 50, social: 50, ecology: 50, faisabilite: 50 }

      // Format conversation as readable text (not as messages array — avoids model continuing the chat)
      const convoText = formattedMessages
        .map(m => `${m.role === 'user' ? 'UTILISATEUR' : "L'OPPOSANT"}: ${m.content}`)
        .join('\n\n---\n\n')

      const lawsJson = isDebate
        ? JSON.stringify([
            { label: 'LOI A', text: law1, scores: sc1 },
            { label: 'LOI B', text: law2, scores: sc2 }
          ])
        : JSON.stringify([
            { label: 'LOI', text: law || law1, scores: sc0 }
          ])

      const summarySystem = `Tu es un journaliste politique qui analyse un débat. Retourne UNIQUEMENT un objet JSON valide (rien d'autre, pas de markdown, pas de texte autour).

Lois à analyser (scores déjà calculés, ne les change pas) : ${lawsJson}

Format JSON STRICT à respecter :
{
  "laws": [
    {
      "label": "LOI A",
      "text": "<texte exact de la loi>",
      "viable": <true si score global >= 50, false sinon>,
      "reason": "<1 phrase factuelle expliquant pourquoi viable ou pas, basée sur le débat>",
      "scores": { "economy": <valeur fournie>, "social": <valeur fournie>, "ecology": <valeur fournie>, "faisabilite": <valeur fournie> }
    }
  ],
  "keyPoint": "<La question centrale non résolue du débat, en 1 phrase>",
  "conclusion": "<1 phrase drôle, cynique et piquante style L'Opposant Féroce pour clore le débat>"
}`

      const rawText = await getCompleteMessage(client, {
        model: MODEL_FREE,
        max_tokens: 1800,
        system: summarySystem,
        messages: [{ role: 'user', content: `Voici le débat à analyser :\n\n${convoText}` }],
      })
      // Try to parse JSON, fallback to raw text
      let summaryData
      try {
        const match = rawText.match(/\{[\s\S]*\}/)
        summaryData = match ? JSON.parse(match[0]) : null
      } catch { summaryData = null }

      return NextResponse.json({
        summary: summaryData ? JSON.stringify(summaryData) : rawText,
        parsed: !!summaryData
      }, { headers: corsHeaders })
    }

    // --- CHAT MODE ---
    let lawContext
    if (selectedLaws === 'both' && law1 && law2) {
      lawContext = `CONTEXTE DES LOIS DÉBATTUES:\nLOI A: "${law1}"\nLOI B: "${law2}"\n\nL'utilisateur peut défendre l'une, l'autre, ou les deux à la fois. Attaque les deux avec la même rigueur.`
    } else {
      lawContext = `CONTEXTE DE LA LOI DÉBATTUE:\n"${law || law1}"`
    }

    const systemWithContext = `${DEBATE_CHAT_PROMPT}

${lawContext}

SCORES ACTUELS:
- Économie: ${currentScores?.economy || 50}/100
- Social: ${currentScores?.social || 50}/100
- Écologie: ${currentScores?.ecology || 50}/100
- Faisabilité: ${currentScores?.faisabilite || 50}/100
- Score Global: ${currentScores?.overall || 50}/100

Tu dois ajuster ces scores en fonction de la qualité des arguments de l'utilisateur.`

    const text = await getCompleteMessage(client, {
      model: MODEL_FREE,
      max_tokens: 2048,
      system: systemWithContext,
      messages: formattedMessages,
    })

    let responseText = text
    let scoreAdjustment = null

    const jsonMatch = text.match(/\{"score_adjustment":\s*(-?\d+),\s*"new_scores":\s*\{[^}]+\}\}/s)
    if (jsonMatch) {
      try {
        scoreAdjustment = JSON.parse(jsonMatch[0])
        responseText = text.replace(jsonMatch[0], '').trim()
      } catch (e) {
        console.error('Failed to parse score adjustment:', e)
      }
    }

    return NextResponse.json({ response: responseText, scoreAdjustment }, { headers: corsHeaders })

  } catch (error) {
    console.error('Debate Chat Error:', error)
    return NextResponse.json({ error: 'Erreur lors du débat: ' + error.message }, { status: 500, headers: corsHeaders })
  }
}

// Create share
async function handleCreateShare(request) {
  try {
    const body = await request.json()
    const { shareUrl, ogImageUrl, shareId } = await createShare(body)
    return NextResponse.json({ shareUrl, ogImageUrl, shareId }, { headers: corsHeaders })
  } catch (error) {
    console.error('Share creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}

// Get history
async function handleGetHistory(request) {
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ history: [] }, { headers: corsHeaders })
  }
  
  const user = await getUser(request)

  if (!user) {
    return NextResponse.json({ history: [] }, { headers: corsHeaders })
  }

  const query = supabase
    .from('laws_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  
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
  
  const [topEconomy, topSocial, topEcology, topOverall, flopEconomy, flopSocial, flopEcology, flopOverall] = await Promise.all([
    supabase.from('laws_history').select('law_text, score_economy').order('score_economy', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_social').order('score_social', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_ecology').order('score_ecology', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_overall').order('score_overall', { ascending: false }).limit(5),
    supabase.from('laws_history').select('law_text, score_economy').order('score_economy', { ascending: true }).limit(5),
    supabase.from('laws_history').select('law_text, score_social').order('score_social', { ascending: true }).limit(5),
    supabase.from('laws_history').select('law_text, score_ecology').order('score_ecology', { ascending: true }).limit(5),
    supabase.from('laws_history').select('law_text, score_overall').order('score_overall', { ascending: true }).limit(5)
  ])

  return NextResponse.json({
    leaderboard: {
      economy: (topEconomy.data || []).map(h => ({ law: h.law_text, score: h.score_economy })),
      social: (topSocial.data || []).map(h => ({ law: h.law_text, score: h.score_social })),
      ecology: (topEcology.data || []).map(h => ({ law: h.law_text, score: h.score_ecology })),
      overall: (topOverall.data || []).map(h => ({ law: h.law_text, score: h.score_overall }))
    },
    flop: {
      economy: (flopEconomy.data || []).map(h => ({ law: h.law_text, score: h.score_economy })),
      social: (flopSocial.data || []).map(h => ({ law: h.law_text, score: h.score_social })),
      ecology: (flopEcology.data || []).map(h => ({ law: h.law_text, score: h.score_ecology })),
      overall: (flopOverall.data || []).map(h => ({ law: h.law_text, score: h.score_overall }))
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
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    allow_promotion_codes: true,
    metadata: { user_id: user.id }
  })
  
  return NextResponse.json({ url: session.url }, { headers: corsHeaders })
}

// Stripe: Cancel subscription
async function handleCancelSubscription(request) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: corsHeaders })
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service non disponible' }, { status: 500, headers: corsHeaders })
  }

  const { data: profile } = await supabase.from('profiles').select('stripe_subscription_id').eq('id', user.id).single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400, headers: corsHeaders })
  }

  try {
    await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: 'Erreur lors de la résiliation' }, { status: 500, headers: corsHeaders })
  }
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
