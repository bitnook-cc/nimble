import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { createNimbleJWT } from '@/lib/auth/jwt'
import { UserTag } from '@/types/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    console.log('Auth callback processing:', {
      code: code ? 'present' : 'missing',
      origin,
      next,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV
    })
    
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Supabase auth exchange failed:', {
        error: error.message,
        code: error.status,
        origin,
        next,
        timestamp: new Date().toISOString()
      })
    }
    
    if (!error && data.user) {
      console.log('User authenticated successfully:', {
        userId: data.user.id,
        email: data.user.email,
        identities: data.user.identities?.length || 0,
        appMetadata: data.user.app_metadata,
        userMetadata: data.user.user_metadata
      })
      
      // Use Supabase's built-in user system - no custom tables needed!
      // Get user tags from app_metadata (managed by database functions/triggers)
      const userTags = (data.user.app_metadata?.tags || []) as UserTag[]
      
      // Create custom JWT with the stable Supabase user ID
      const nimbleToken = createNimbleJWT(data.user.id, userTags)
      
      // Set the JWT cookie using Next.js cookies API
      const cookieStore = await cookies()
      const cookieDomain = process.env.NODE_ENV === 'production' 
        ? process.env.COOKIE_DOMAIN || '.nimble.game'
        : 'localhost'
      
      cookieStore.set('nimble-auth', nimbleToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: cookieDomain,
        path: '/',
        maxAge: 86400 // 24 hours
      })
      
      // Use Next.js redirect with proper URL validation
      // Ensure we don't redirect to external domains in production
      const redirectPath = next.startsWith('/') ? next : '/'
      redirect(redirectPath)
    }
  }

  // Log detailed error information before redirecting
  console.error('Authentication callback failed:', {
    code: code ? 'present' : 'missing',
    origin,
    next,
    searchParams: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  })
  
  // Return the user to an error page with instructions
  redirect('/auth/auth-code-error')
}