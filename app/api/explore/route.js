// app/api/explore/route.js
// ─────────────────────────────────────────────────────────
// Génère la constellation d'implications pour une loi donnée
// POST { law: string } → { sector, rings: [{nodes}×3] }
// ─────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser, getUserTierInfo, checkFeatureRateLimit, EXPLORE_LIMITS, RATE_MESSAGES } from '@/lib/rateLimit'

const MODEL_FREE = process.env.CLAUDE_MODEL_FREE || 'claude-haiku-4-5-20251001'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const EXPLORE_SYSTEM_PROMPT = `Tu es un expert en politique et droit français. Tu génères des cartes d'implications législatives pour des propositions de loi.

Retourne UNIQUEMENT un objet JSON valide (aucun texte autour, aucun markdown, pas de \`\`\`json).

Structure exacte attendue :
{
  "sector": "<secteur principal : economie | libertes | securite | social | environnement | numerique>",
  "rings": [
    {
      "nodes": [
        { "id": "<kebab-id-unique>", "title": "<titre max 55 chars>", "sector": "<secteur>", "summary": "<1 phrase max 115 chars>" },
        ...4 à 5 nodes
      ]
    },
    {
      "nodes": [
        ...4 à 6 nodes
      ]
    },
    {
      "nodes": [
        ...4 à 6 nodes
      ]
    }
  ]
}

Règles strictes :
- Ring 0 : conséquences directes et immédiates (groupes affectés, obligations créées, droits modifiés)
- Ring 1 : lois et règlements connexes (textes existants liés, directives européennes, codes impactés)
- Ring 2 : effets de 2ème ordre à 5-10 ans (risques non intentionnels, opportunités économiques, effets sociaux)
- Sectors disponibles : economie, libertes, securite, social, environnement, numerique
- IDs : kebab-case sans accents, uniques dans la réponse
- Chaque node doit être SPÉCIFIQUE à cette loi précise, pas générique
- Varier les secteurs pour avoir de la diversité visuelle (pas tous le même secteur)
- Sois concret, factuel, et légèrement pessimiste comme un vrai analyste politique`

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

  const { law } = body

  if (!law || typeof law !== 'string' || !law.trim()) {
    return NextResponse.json({ error: 'Proposition de loi requise' }, { status: 400, headers: corsHeaders })
  }

  const trimmed = law.trim()
  if (trimmed.length < 8) {
    return NextResponse.json({ error: 'Proposition trop courte (minimum 8 caractères)' }, { status: 400, headers: corsHeaders })
  }

  // Rate limiting
  const user = await getUser(request)
  const { identifier, identifierType, userTier } = getUserTierInfo(user)
  const limits = EXPLORE_LIMITS[userTier]
  const rateLimit = await checkFeatureRateLimit(identifier, identifierType, limits, 'explore')

  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'rate_limit_exceeded',
      message: RATE_MESSAGES.explore[userTier] || 'Limite atteinte.',
      remaining: 0,
      resetAt: rateLimit.resetAt,
      userTier,
    }, { status: 429, headers: corsHeaders })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: MODEL_FREE,
      max_tokens: 2048,
      system: EXPLORE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Proposition de loi : "${trimmed}"` }],
    })

    const text = message.content[0]?.text || ''

    // Extract JSON robustly
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[explore] No JSON found in response:', text.slice(0, 200))
      throw new Error('Pas de JSON dans la réponse Claude')
    }

    let data
    try {
      data = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[explore] JSON parse error:', e.message)
      throw new Error('JSON invalide dans la réponse Claude')
    }

    // Validate structure
    if (!data.sector || !Array.isArray(data.rings) || data.rings.length < 3) {
      throw new Error('Structure de constellation invalide')
    }

    // Ensure each ring has nodes array
    data.rings = data.rings.slice(0, 3).map(ring => ({
      nodes: Array.isArray(ring.nodes) ? ring.nodes : [],
    }))

    return NextResponse.json(data, { headers: corsHeaders })
  } catch (error) {
    console.error('[explore] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de la carte' },
      { status: 500, headers: corsHeaders }
    )
  }
}
