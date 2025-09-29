import { NextRequest } from 'next/server'
import { verifyNimbleJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('nimble-auth')
  
  if (!cookie?.value) {
    return Response.json(
      { 
        error: 'Not authenticated',
        login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      },
      { status: 401 }
    )
  }

  const auth = verifyNimbleJWT(cookie.value)
  if (!auth) {
    return Response.json(
      { 
        error: 'Invalid token',
        login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      },
      { status: 401 }
    )
  }

  return Response.json({
    user_id: auth.sub,
    tags: auth.tags,
    expires_at: new Date(auth.exp * 1000).toISOString(),
    cached_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour cache suggestion
  })
}