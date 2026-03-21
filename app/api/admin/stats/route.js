import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Whitelist admin — variable d'env ADMIN_EMAILS obligatoire (comma-separated)
// Aucun fallback intentionnel : si la variable n'est pas définie, l'accès admin est bloqué.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const ALLOWED_ORIGIN = process.env.CORS_ORIGINS?.split(',')[0]?.trim() || 'https://butterflygov.com'
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request) {
  // Auth check
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: corsHeaders })
  }

  // Admin check: must be premium + whitelisted email
  const email = user.email?.toLowerCase()
  if (!user.profile?.is_premium || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403, headers: corsHeaders })
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Service non disponible' }, { status: 500, headers: corsHeaders })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Run all queries in parallel
    const [
      todayRes,
      weekRes,
      monthRes,
      byModeRes,
      byTierRes,
      uniqueTodayRes,
      avgTimeRes,
      topPropsRes,
    ] = await Promise.all([
      // Total analyses aujourd'hui
      supabase.from('analytics').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      // Total cette semaine
      supabase.from('analytics').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
      // Total ce mois
      supabase.from('analytics').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      // Répartition par mode (30 derniers jours)
      supabase.rpc('analytics_count_by_mode', {}).catch(() => null),
      // Répartition par tier (30 derniers jours)
      supabase.rpc('analytics_count_by_tier', {}).catch(() => null),
      // Users uniques aujourd'hui
      supabase.from('analytics').select('user_id, ip_address').gte('created_at', todayStart),
      // Temps de réponse moyen
      supabase.from('analytics').select('response_time_ms').gte('created_at', weekStart).not('response_time_ms', 'is', null),
      // Top 5 propositions
      supabase.from('analytics').select('proposition').gte('created_at', monthStart).not('proposition', 'is', null),
    ])

    // Compute by-mode manually from raw data if RPC not available
    let byMode = {}
    let byTier = {}

    if (byModeRes?.data) {
      byMode = Object.fromEntries(byModeRes.data.map(r => [r.mode, r.count]))
    } else {
      // Fallback: query raw and aggregate
      const { data: rawMonth } = await supabase.from('analytics').select('mode, tier').gte('created_at', monthStart)
      if (rawMonth) {
        rawMonth.forEach(r => {
          byMode[r.mode] = (byMode[r.mode] || 0) + 1
          byTier[r.tier] = (byTier[r.tier] || 0) + 1
        })
      }
    }

    if (byTierRes?.data) {
      byTier = Object.fromEntries(byTierRes.data.map(r => [r.tier, r.count]))
    }

    // Unique users today
    const uniqueToday = uniqueTodayRes?.data
      ? new Set(uniqueTodayRes.data.map(r => r.user_id || r.ip_address)).size
      : 0

    // Average response time
    const avgTime = avgTimeRes?.data?.length
      ? Math.round(avgTimeRes.data.reduce((sum, r) => sum + r.response_time_ms, 0) / avgTimeRes.data.length)
      : 0

    // Top 5 propositions
    const propCounts = {}
    topPropsRes?.data?.forEach(r => {
      if (r.proposition) {
        const key = r.proposition.slice(0, 100)
        propCounts[key] = (propCounts[key] || 0) + 1
      }
    })
    const topPropositions = Object.entries(propCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }))

    return NextResponse.json({
      totals: {
        today: todayRes?.count || 0,
        week: weekRes?.count || 0,
        month: monthRes?.count || 0,
      },
      byMode,
      byTier,
      uniqueUsersToday: uniqueToday,
      avgResponseTimeMs: avgTime,
      topPropositions,
    }, { headers: corsHeaders })
  } catch (err) {
    console.error('[Admin stats] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: corsHeaders })
  }
}
