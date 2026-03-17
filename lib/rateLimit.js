// lib/rateLimit.js
// ─────────────────────────────────────────────────────────
// Utilitaire de rate limiting partagé (Supabase + in-memory fallback)
// Utilisé par : /api/explain, /api/explore, /api/explore/expand
// ─────────────────────────────────────────────────────────

import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// In-memory fallback (par instance serverless)
const rateLimitStore = new Map()

// ── Configs par feature ───────────────────────────────────

export const EXPLAIN_LIMITS = {
  anonymous: { max: 1,     windowMs: 24 * 60 * 60 * 1000 }, // 1/jour
  free:      { max: 3,     windowMs: 24 * 60 * 60 * 1000 }, // 3/jour
  premium:   { max: 10000, windowMs: 24 * 60 * 60 * 1000 }, // Illimité
}

export const EXPLORE_LIMITS = {
  anonymous: { max: 1,     windowMs: 24 * 60 * 60 * 1000 }, // 1 carte/jour
  free:      { max: 3,     windowMs: 24 * 60 * 60 * 1000 }, // 3 cartes/jour
  premium:   { max: 10000, windowMs: 24 * 60 * 60 * 1000 }, // Illimité
}

export const EXPAND_LIMITS = {
  anonymous: { max: 100,   windowMs: 24 * 60 * 60 * 1000 }, // Illimité (1 seule carte)
  free:      { max: 9,     windowMs: 24 * 60 * 60 * 1000 }, // 3 par carte × 3 cartes
  premium:   { max: 10000, windowMs: 24 * 60 * 60 * 1000 }, // Illimité
}

// ── Messages par feature + tier ───────────────────────────

export const RATE_MESSAGES = {
  explain: {
    anonymous: "Vous avez utilisé votre explication gratuite du jour. Créez un compte pour obtenir 3 explications par jour, ou passez Premium pour un accès illimité.",
    free: "Vous avez utilisé vos 3 explications du jour. Passez Premium pour un accès illimité à 7,99€/mois.",
  },
  explore: {
    anonymous: "Vous avez utilisé votre carte gratuite du jour. Créez un compte pour obtenir 3 cartes par jour, ou passez Premium pour un accès illimité.",
    free: "Vous avez utilisé vos 3 cartes du jour. Passez Premium pour un accès illimité à 7,99€/mois.",
  },
  expand: {
    anonymous: "Limite d'explorations de nœuds atteinte.",
    free: "Vous avez atteint vos 9 explorations de nœuds du jour (3 par carte). Passez Premium pour explorer sans limite à 7,99€/mois.",
  },
}

// ── Helpers ──────────────────────────────────────────────

export function getClientIP() {
  const headersList = headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return headersList.get('x-real-ip') || 'unknown'
}

export async function getUser(request) {
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

export function getUserTierInfo(user) {
  const ip = getClientIP()
  if (user) {
    const tier = user.profile?.is_premium ? 'premium' : 'free'
    return { identifier: user.id, identifierType: 'user', userTier: tier }
  }
  return { identifier: ip, identifierType: 'ip', userTier: 'anonymous' }
}

// ── Rate limit checker ──────────────────────────────────

/**
 * Check rate limit for a feature.
 * @param {string} identifier - user ID or IP
 * @param {string} identifierType - 'user' or 'ip'
 * @param {{ max: number, windowMs: number }} limits - limit config for this tier
 * @param {string} prefix - feature prefix (e.g., 'explain', 'explore', 'expand')
 * @returns {{ allowed: boolean, remaining: number, resetAt: Date }}
 */
export async function checkFeatureRateLimit(identifier, identifierType, limits, prefix) {
  const supabase = createServiceClient()
  const windowStart = new Date(Date.now() - limits.windowMs)
  const prefixedId = `${prefix}:${identifier}`

  if (supabase) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('identifier', prefixedId)
        .eq('identifier_type', identifierType)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        return { allowed: true, remaining: limits.max, resetAt: new Date(Date.now() + limits.windowMs) }
      }

      const now = new Date()

      if (!existing) {
        await supabase.from('rate_limits').insert({
          identifier: prefixedId,
          identifier_type: identifierType,
          request_count: 1,
          window_start: now,
        })
        return { allowed: true, remaining: limits.max - 1, resetAt: new Date(Date.now() + limits.windowMs) }
      }

      if (new Date(existing.window_start) < windowStart) {
        await supabase.from('rate_limits')
          .update({ request_count: 1, window_start: now })
          .eq('identifier', prefixedId).eq('identifier_type', identifierType)
        return { allowed: true, remaining: limits.max - 1, resetAt: new Date(Date.now() + limits.windowMs) }
      }

      if (existing.request_count >= limits.max) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(new Date(existing.window_start).getTime() + limits.windowMs),
        }
      }

      await supabase.from('rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('identifier', prefixedId).eq('identifier_type', identifierType)

      return {
        allowed: true,
        remaining: limits.max - existing.request_count - 1,
        resetAt: new Date(new Date(existing.window_start).getTime() + limits.windowMs),
      }
    } catch (err) {
      console.error(`[${prefix}] Rate limit error:`, err)
    }
  }

  // In-memory fallback
  const key = `${prefix}:${identifierType}:${identifier}`
  const now = Date.now()
  let record = rateLimitStore.get(key)

  if (!record || record.windowStart < windowStart.getTime()) {
    record = { count: 1, windowStart: now }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: limits.max - 1, resetAt: new Date(now + limits.windowMs) }
  }

  if (record.count >= limits.max) {
    return { allowed: false, remaining: 0, resetAt: new Date(record.windowStart + limits.windowMs) }
  }

  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true, remaining: limits.max - record.count, resetAt: new Date(record.windowStart + limits.windowMs) }
}
