import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT_EXPLICATION, buildExplicationPrompt } from '@/lib/prompts/explication'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Modèle configurable via variable d'environnement
const MODEL_FREE = process.env.CLAUDE_MODEL_FREE || 'claude-haiku-4-5-20251001'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

async function getUser(request) {
  const supabase = createServiceClient()
  if (!supabase) return null
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { ...user, profile }
}

function getClientIP(request) {
  const headersList = headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return headersList.get('x-real-ip') || 'unknown'
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

  const { query, assemblyData } = body

  if (!query || typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'Le champ "query" est requis' }, { status: 400, headers: corsHeaders })
  }

  // Rate limiting — reuse same tier logic
  const user = await getUser(request)
  const ip = getClientIP(request)
  const isPremium = user?.profile?.is_premium

  // Explication is available to all tiers (same daily limits as analyze)
  // Premium users have no friction; anonymous/free get a lighter limit check
  // We let this endpoint through freely since it's a "read-only" explainer
  // but still check for auth to allow premium features later
  const userTier = isPremium ? 'premium' : user ? 'free' : 'anonymous'

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const userPrompt = buildExplicationPrompt(query.trim(), assemblyData || null)

  // Build streaming response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let sourceCount = 0

      try {
        const anthropicStream = anthropic.messages.stream({
          model: MODEL_FREE,
          system: SYSTEM_PROMPT_EXPLICATION,
          max_tokens: 4096,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: userPrompt }],
        })

        // Stream text chunks as SSE events
        anthropicStream.on('text', (text) => {
          const data = JSON.stringify({ type: 'text', text })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        })

        // Notify frontend when a web search is triggered (tool_use block)
        anthropicStream.on('contentBlock', (block) => {
          if (block.type === 'tool_use' && block.name === 'web_search') {
            const evt = JSON.stringify({ type: 'searching', query: block.input?.query || '' })
            controller.enqueue(encoder.encode(`data: ${evt}\n\n`))
          }
        })

        // Count web searches from the final message
        const finalMsg = await anthropicStream.finalMessage()
        sourceCount = finalMsg.content?.filter(b => b.type === 'tool_use' && b.name === 'web_search').length || 0

        // Send done event with metadata
        const done = JSON.stringify({ type: 'done', sourceCount, tier: userTier })
        controller.enqueue(encoder.encode(`data: ${done}\n\n`))
      } catch (err) {
        console.error('[Explain] Stream error:', err)
        const error = JSON.stringify({ type: 'error', message: err.message })
        controller.enqueue(encoder.encode(`data: ${error}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
