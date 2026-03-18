// lib/analytics.js
// ─────────────────────────────────────────────────────────
// Fire-and-forget analytics tracking for all Claude API calls.
// Usage:
//   trackAnalysis({ mode: 'analyse', ... }).catch(() => {})
// ─────────────────────────────────────────────────────────

import { createServiceClient } from '@/lib/supabase/server'

/**
 * Track an API call to Claude (analyse, explication, chat, explore, expand).
 * This function NEVER throws — it catches all errors silently.
 *
 * @param {Object} params
 * @param {string}  params.mode           - Required: 'analyse' | 'explication' | 'chat' | 'explore' | 'expand'
 * @param {string}  [params.userId]       - Supabase user ID (null for anonymous)
 * @param {string}  [params.ip]           - Client IP address
 * @param {string}  [params.tier]         - 'anonymous' | 'free' | 'premium'
 * @param {string}  [params.proposition]  - The law/text submitted (truncated to 500 chars)
 * @param {string}  [params.modelUsed]    - Claude model used
 * @param {number}  [params.tokensUsed]   - Output tokens consumed
 * @param {number}  [params.responseTimeMs] - Duration in ms
 * @param {string}  [params.status]       - 'success' | 'error' | 'rate_limited'
 * @param {string}  [params.errorMessage] - Error message if status is 'error'
 */
export async function trackAnalysis({
  mode,
  userId = null,
  ip = null,
  tier = 'anonymous',
  proposition = null,
  modelUsed = null,
  tokensUsed = null,
  responseTimeMs = null,
  status = 'success',
  errorMessage = null,
}) {
  try {
    const supabase = createServiceClient()
    if (!supabase) return // Supabase not configured — skip silently

    await supabase.from('analytics').insert({
      user_id: userId || null,
      ip_address: ip || null,
      tier: tier || 'anonymous',
      mode,
      proposition: proposition ? proposition.slice(0, 500) : null,
      model_used: modelUsed || null,
      tokens_used: tokensUsed || null,
      response_time_ms: responseTimeMs || null,
      status: status || 'success',
      error_message: errorMessage ? errorMessage.slice(0, 500) : null,
    })
  } catch (err) {
    // Never block the user response — just log
    console.error('[analytics] tracking failed:', err.message)
  }
}
