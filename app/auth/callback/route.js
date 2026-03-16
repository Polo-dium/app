import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Log OAuth errors for silent failure debugging
  if (error) {
    console.error('[OAuth Callback] Error:', error, '—', errorDescription)
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (!code) {
    console.error('[OAuth Callback] No code received — possible misconfigured redirect URL')
    return NextResponse.redirect(`${origin}/?auth_error=no_code`)
  }

  const supabase = createServiceClient()
  if (!supabase) {
    console.error('[OAuth Callback] Supabase not configured')
    return NextResponse.redirect(`${origin}/`)
  }

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[OAuth Callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`)
  }

  // Ensure profile row exists (trigger should handle this, but belt-and-suspenders)
  if (data?.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileError) {
      console.error('[OAuth Callback] Profile upsert failed:', profileError.message)
      // Non-fatal — user can still log in
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
