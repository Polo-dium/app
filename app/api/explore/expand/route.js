// app/api/explore/expand/route.js
// ─────────────────────────────────────────────────────────
// Génère 2-3 sous-implications pour une node cliquée
// POST { law, nodeTitle, nodeSummary } → { children: [...] }
// ─────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser, getUserTierInfo, checkFeatureRateLimit, EXPAND_LIMITS, RATE_MESSAGES } from '@/lib/rateLimit'

const MODEL_FREE = process.env.CLAUDE_MODEL_FREE || 'claude-haiku-4-5-20251001'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const EXPAND_SYSTEM_PROMPT = `Tu es un expert en politique et droit français. On t'indique une proposition de loi et une de ses implications. Tu dois générer exactement 3 sous-implications (externalités et besoins législatifs) de cette implication spécifique.

Retourne UNIQUEMENT un objet JSON valide (aucun texte autour, aucun markdown, pas de \`\`\`json).

Structure exacte attendue :
{
  "children": [
    { "id": "<kebab-id-unique>", "title": "<titre max 45 chars>", "sector": "<secteur>", "summary": "<1 phrase max 100 chars>" },
    { "id": "<kebab-id-unique>", "title": "<titre max 45 chars>", "sector": "<secteur>", "summary": "<1 phrase max 100 chars>" },
    { "id": "<kebab-id-unique>", "title": "<titre max 45 chars>", "sector": "<secteur>", "summary": "<1 phrase max 100 chars>" }
  ]
}

Règles :
- Chaque sous-implication doit être une conséquence DIRECTE de l'implication fournie, en lien avec la loi d'origine
- Sectors : economie, libertes, securite, social, environnement, numerique
- IDs : kebab-case sans accents, préfixés par "sub-"
- Sois concret, spécifique, et diversifie les secteurs`

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500, headers: corsHeaders })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400, headers: corsHeaders })
  }

  const { law, nodeTitle, nodeSummary } = body

  if (!law || !nodeTitle) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400, headers: corsHeaders })
  }

  // Rate limiting
  const user = await getUser(request)
  const { identifier, identifierType, userTier } = getUserTierInfo(user)
  const limits = EXPAND_LIMITS[userTier]
  const rateLimit = await checkFeatureRateLimit(identifier, identifierType, limits, 'expand')

  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'rate_limit_exceeded',
      message: RATE_MESSAGES.expand[userTier] || 'Limite d\'explorations atteinte.',
      remaining: 0,
      resetAt: rateLimit.resetAt,
      userTier,
    }, { status: 429, headers: corsHeaders })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: MODEL_FREE,
      max_tokens: 800,
      system: EXPAND_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Loi d'origine : "${law.trim()}"\nImplication cliquée : "${nodeTitle}"${nodeSummary ? `\nDétail : "${nodeSummary}"` : ''}\n\nGénère 3 sous-implications concrètes.`,
      }],
    })

    const text = message.content[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')

    let data
    try {
      data = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error('JSON invalide')
    }

    if (!Array.isArray(data.children) || data.children.length < 2) {
      throw new Error('Structure invalide')
    }

    // Limiter à 3 et valider
    data.children = data.children.slice(0, 3).map((c, i) => ({
      id: c.id || `sub-${i}-${Date.now()}`,
      title: (c.title || '').slice(0, 50),
      sector: c.sector || 'social',
      summary: (c.summary || '').slice(0, 120),
    }))

    return NextResponse.json(data, { headers: corsHeaders })
  } catch (error) {
    console.error('[explore/expand] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'expansion' },
      { status: 500, headers: corsHeaders }
    )
  }
}
