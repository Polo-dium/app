import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT_EXPLICATION, buildExplicationPrompt } from '@/lib/prompts/explication'
import { getUser, getUserTierInfo, getClientIP, checkFeatureRateLimit, EXPLAIN_LIMITS, RATE_MESSAGES } from '@/lib/rateLimit'
import { trackAnalysis } from '@/lib/analytics'

// Modèle configurable via variable d'environnement
const MODEL_FREE = process.env.CLAUDE_MODEL_FREE || 'claude-haiku-4-5-20251001'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  // Rate limiting
  const user = await getUser(request)
  const { identifier, identifierType, userTier } = getUserTierInfo(user)
  const ip = getClientIP()
  const limits = EXPLAIN_LIMITS[userTier]
  const rateLimit = await checkFeatureRateLimit(identifier, identifierType, limits, 'explain')

  if (!rateLimit.allowed) {
    trackAnalysis({ mode: 'explication', userId: user?.id, ip, tier: userTier, proposition: query, status: 'rate_limited' }).catch(() => {})
    return NextResponse.json({
      error: 'rate_limit_exceeded',
      message: RATE_MESSAGES.explain[userTier] || 'Limite atteinte.',
      remaining: 0,
      resetAt: rateLimit.resetAt,
      userTier,
    }, { status: 429, headers: corsHeaders })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const userPrompt = buildExplicationPrompt(query.trim(), assemblyData || null)
  const startTime = Date.now()

  // Build streaming response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let sourceCount = 0
      let tokensUsed = null

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
        tokensUsed = finalMsg.usage?.output_tokens || null

        // Send done event with metadata
        const done = JSON.stringify({ type: 'done', sourceCount, tier: userTier })
        controller.enqueue(encoder.encode(`data: ${done}\n\n`))

        // Track success (fire-and-forget)
        trackAnalysis({ mode: 'explication', userId: user?.id, ip, tier: userTier, proposition: query, modelUsed: MODEL_FREE, tokensUsed, responseTimeMs: Date.now() - startTime, status: 'success' }).catch(() => {})
      } catch (err) {
        console.error('[Explain] Stream error:', err)
        const error = JSON.stringify({ type: 'error', message: err.message })
        controller.enqueue(encoder.encode(`data: ${error}\n\n`))

        // Track error (fire-and-forget)
        trackAnalysis({ mode: 'explication', userId: user?.id, ip, tier: userTier, proposition: query, modelUsed: MODEL_FREE, responseTimeMs: Date.now() - startTime, status: 'error', errorMessage: err.message }).catch(() => {})
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
