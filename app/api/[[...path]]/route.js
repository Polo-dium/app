import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// MongoDB connection
let cachedClient = null
async function getMongoClient() {
  if (cachedClient) return cachedClient
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  cachedClient = client
  return client
}

async function getDb() {
  const client = await getMongoClient()
  return client.db('butterfly_gov')
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
    
    if (endpoint === 'analyze') {
      return handleAnalyze(request)
    }
    
    if (endpoint === 'debate') {
      return handleDebate(request)
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
    return NextResponse.json(
      { status: 'ok', service: 'Butterfly.gov' },
      { headers: corsHeaders }
    )
  }
  
  if (endpoint === 'history') {
    return handleGetHistory(request)
  }
  
  if (endpoint === 'leaderboard') {
    return handleGetLeaderboard(request)
  }
  
  return NextResponse.json(
    { message: 'Butterfly.gov API', endpoints: ['/api/analyze', '/api/debate', '/api/history', '/api/leaderboard'] },
    { headers: corsHeaders }
  )
}

// Analyze a single law
async function analyzeLaw(law) {
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
  
  const responseText = message.content[0].text
  
  // Clean and parse JSON
  const cleanedText = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  
  const analysis = JSON.parse(cleanedText)
  
  // Ensure scores are within bounds
  analysis.scores = {
    economy: Math.max(0, Math.min(100, analysis.scores.economy || 50)),
    social: Math.max(0, Math.min(100, analysis.scores.social || 50)),
    ecology: Math.max(0, Math.min(100, analysis.scores.ecology || 50))
  }
  
  // Calculate overall score
  analysis.scores.overall = Math.round(
    (analysis.scores.economy + analysis.scores.social + analysis.scores.ecology) / 3
  )
  
  return analysis
}

// Handle single law analysis
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
    const analysis = await analyzeLaw(law)
    
    // Save to history
    try {
      const db = await getDb()
      await db.collection('history').insertOne({
        id: uuidv4(),
        law: law.trim(),
        analysis,
        createdAt: new Date()
      })
    } catch (dbError) {
      console.error('DB Save Error:', dbError)
      // Continue even if save fails
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

// Handle debate mode (2 laws comparison)
async function handleDebate(request) {
  const body = await request.json()
  const { law1, law2 } = body
  
  if (!law1 || !law2) {
    return NextResponse.json(
      { error: 'Les deux propositions de loi sont requises' },
      { status: 400, headers: corsHeaders }
    )
  }
  
  if (law1.length > 500 || law2.length > 500) {
    return NextResponse.json(
      { error: 'Chaque proposition ne doit pas dépasser 500 caractères' },
      { status: 400, headers: corsHeaders }
    )
  }
  
  try {
    // Analyze both laws in parallel
    const [analysis1, analysis2] = await Promise.all([
      analyzeLaw(law1),
      analyzeLaw(law2)
    ])
    
    // Save both to history
    try {
      const db = await getDb()
      await db.collection('history').insertMany([
        { id: uuidv4(), law: law1.trim(), analysis: analysis1, createdAt: new Date(), isDebate: true },
        { id: uuidv4(), law: law2.trim(), analysis: analysis2, createdAt: new Date(), isDebate: true }
      ])
    } catch (dbError) {
      console.error('DB Save Error:', dbError)
    }
    
    return NextResponse.json({
      law1: { text: law1.trim(), analysis: analysis1 },
      law2: { text: law2.trim(), analysis: analysis2 }
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Debate Analysis Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse: ' + error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Get history
async function handleGetHistory(request) {
  try {
    const db = await getDb()
    const history = await db.collection('history')
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    
    return NextResponse.json({ history }, { headers: corsHeaders })
  } catch (error) {
    console.error('History Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Get leaderboard
async function handleGetLeaderboard(request) {
  try {
    const db = await getDb()
    
    // Get top scores for each category
    const [topEconomy, topSocial, topEcology, topOverall] = await Promise.all([
      db.collection('history')
        .find({})
        .sort({ 'analysis.scores.economy': -1 })
        .limit(5)
        .toArray(),
      db.collection('history')
        .find({})
        .sort({ 'analysis.scores.social': -1 })
        .limit(5)
        .toArray(),
      db.collection('history')
        .find({})
        .sort({ 'analysis.scores.ecology': -1 })
        .limit(5)
        .toArray(),
      db.collection('history')
        .find({})
        .sort({ 'analysis.scores.overall': -1 })
        .limit(5)
        .toArray()
    ])
    
    return NextResponse.json({
      leaderboard: {
        economy: topEconomy.map(h => ({ law: h.law, score: h.analysis.scores.economy })),
        social: topSocial.map(h => ({ law: h.law, score: h.analysis.scores.social })),
        ecology: topEcology.map(h => ({ law: h.law, score: h.analysis.scores.ecology })),
        overall: topOverall.map(h => ({ law: h.law, score: h.analysis.scores.overall }))
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Leaderboard Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du leaderboard' },
      { status: 500, headers: corsHeaders }
    )
  }
}
