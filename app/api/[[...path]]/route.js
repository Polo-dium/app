import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Initialize Anthropic client
const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }
  return new Anthropic({
    apiKey: apiKey,
  })
}

// System prompt for SimulVote - Neutral and objective analysis
const SYSTEM_PROMPT = `Rôle :
Tu es le moteur logique de "SimulVote", un simulateur macro-économique, sociologique et environnemental ultra-avancé. Ton rôle est de calculer de manière clinique, neutre et objective les conséquences de la loi ou mesure politique proposée par l'utilisateur.

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

// Handle OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Main POST handler
export async function POST(request, { params }) {
  try {
    const path = params?.path || []
    const endpoint = path.join('/')
    
    // Route: /api/analyze
    if (endpoint === 'analyze' || endpoint === '') {
      return handleAnalyze(request)
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

// GET handler for health check
export async function GET(request, { params }) {
  const path = params?.path || []
  const endpoint = path.join('/')
  
  if (endpoint === 'health') {
    return NextResponse.json(
      { status: 'ok', service: 'SimulVote / Butterfly.gov' },
      { headers: corsHeaders }
    )
  }
  
  return NextResponse.json(
    { message: 'SimulVote API', endpoints: ['/api/analyze', '/api/health'] },
    { headers: corsHeaders }
  )
}

// Analyze law proposal
async function handleAnalyze(request) {
  const body = await request.json()
  const { law } = body
  
  if (!law || typeof law !== 'string' || law.trim().length === 0) {
    return NextResponse.json(
      { error: 'Le champ "law" est requis' },
      { status: 400, headers: corsHeaders }
    )
  }
  
  if (law.length > 500) {
    return NextResponse.json(
      { error: 'La proposition de loi ne doit pas dépasser 500 caractères' },
      { status: 400, headers: corsHeaders }
    )
  }
  
  try {
    const client = getAnthropicClient()
    
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyse cette proposition de loi: "${law.trim()}"`
        }
      ]
    })
    
    // Extract text content
    const responseText = message.content[0].text
    
    // Parse JSON response
    let analysis
    try {
      // Clean potential markdown code blocks
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      analysis = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Response:', responseText)
      return NextResponse.json(
        { error: 'Erreur lors de l\'analyse de la réponse IA' },
        { status: 500, headers: corsHeaders }
      )
    }
    
    // Validate response structure
    if (!analysis.winners || !analysis.losers || !analysis.butterfly_effect || !analysis.scores) {
      return NextResponse.json(
        { error: 'Réponse IA incomplète' },
        { status: 500, headers: corsHeaders }
      )
    }
    
    // Ensure scores are within bounds
    analysis.scores = {
      economy: Math.max(0, Math.min(100, analysis.scores.economy || 50)),
      social: Math.max(0, Math.min(100, analysis.scores.social || 50)),
      ecology: Math.max(0, Math.min(100, analysis.scores.ecology || 50))
    }
    
    return NextResponse.json(analysis, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Anthropic API Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec l\'IA: ' + error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}
