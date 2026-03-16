import { createServiceClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://butterflygov.com'

/**
 * Persists an analysis or debate result to the `shares` table and returns the share URL.
 * @param {object} analysisData
 * @returns {{ shareId: string, shareUrl: string, ogImageUrl: string }}
 */
export async function createShare(analysisData) {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Supabase not configured')

  const {
    type = 'analyse',
    proposition,
    score_global,
    scores,
    gagnants,
    perdants,
    effet_papillon,
    loi_a_titre,
    loi_b_titre,
    loi_a_scores,
    loi_b_scores,
    verdict,
  } = analysisData

  const { data, error } = await supabase
    .from('shares')
    .insert({
      type,
      proposition,
      score_global,
      scores,
      gagnants,
      perdants,
      effet_papillon,
      loi_a_titre,
      loi_b_titre,
      loi_a_scores,
      loi_b_scores,
      verdict,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Share creation failed: ${error.message}`)

  const shareId = data.id
  const shareUrl = `${APP_URL}/share/${shareId}`
  const ogImageUrl = `${APP_URL}/api/og/${shareId}`

  return { shareId, shareUrl, ogImageUrl }
}

/**
 * Fetches a share by ID and increments the view counter.
 * @param {string} shareId
 * @returns {object|null}
 */
export async function getShare(shareId) {
  const supabase = createServiceClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('id', shareId)
    .single()

  if (error || !data) return null

  // Increment view count (fire and forget)
  supabase.rpc('increment_share_views', { share_id: shareId }).then(() => {})

  return data
}
