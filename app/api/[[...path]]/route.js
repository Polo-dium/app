import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Initialize OpenAI client with Emergent key (OpenAI-compatible)
const getOpenAIClient = () => {
  const apiKey = process.env.EMERGENT_LLM_KEY
  if (!apiKey) {
    throw new Error('EMERGENT_LLM_KEY not configured')
  }
  return new OpenAI({
    apiKey: apiKey,
  })
}

// System prompt for law analysis
const SYSTEM_PROMPT = `Tu es un analyste politique expert et satirique. Tu analyses les propositions de loi de manière réaliste mais avec une touche d'humour et d'ironie.

Quand on te donne une proposition de loi, tu dois répondre UNIQUEMENT avec un objet JSON valide (sans markdown, sans commentaires) dans ce format exact:
{
  "winners": "Une phrase décrivant qui bénéficie de cette loi",
  "losers": "Une phrase décrivant qui en paie le prix",
  "butterfly_effect": "Une conséquence inattendue, ironique ou absurde à 5 ans",
  "scores": {
    "economy": <nombre entre 0 et 100>,
    "happiness": <nombre entre 0 et 100>,
    "ecology": <nombre entre 0 et 100>
  }
}

Règles:
- Sois réaliste dans ton analyse mais garde une touche d'humour
- L'effet papillon doit être créatif, surprenant et mémorable
- Les scores doivent être cohérents avec l'analyse
- Réponds UNIQUEMENT avec le JSON, rien d'autre
- Les textes doivent être en français
- Garde les réponses concises (1-2 phrases max par champ)`

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
      { status: 'ok', service: 'butterfly.gov' },
      { headers: corsHeaders }
    )
  }
  
  return NextResponse.json(
    { message: 'Butterfly.gov API', endpoints: ['/api/analyze', '/api/health'] },
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
    const client = getOpenAIClient()
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4.1',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Analyse cette proposition de loi: "${law.trim()}"`
        }
      ]
    })
    
    // Extract text content
    const responseText = completion.choices[0].message.content
    
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
      happiness: Math.max(0, Math.min(100, analysis.scores.happiness || 50)),
      ecology: Math.max(0, Math.min(100, analysis.scores.ecology || 50))
    }
    
    return NextResponse.json(analysis, { headers: corsHeaders })
    
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec l\'IA: ' + error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}
