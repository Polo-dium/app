import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null if not configured (checks for empty strings too)
  if (!url || !key || url.trim() === '' || key.trim() === '' || url === 'undefined' || key === 'undefined') {
    console.log('Supabase not configured - running in demo mode')
    return null
  }
  
  try {
    return createBrowserClient(url, key)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}
