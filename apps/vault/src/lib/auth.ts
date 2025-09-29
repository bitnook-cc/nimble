import { verifyNimbleJWT } from '@nimble/shared-auth'
import type { NimbleJWT } from '@nimble/shared-auth'

export function getAuthFromCookie(cookieHeader: string | null): NimbleJWT | null {
  console.log('[auth] getAuthFromCookie called with:', cookieHeader)
  
  if (!cookieHeader) {
    console.log('[auth] No cookie header provided')
    return null
  }
  
  // Parse nimble-auth cookie
  const cookies = cookieHeader.split(';').map(c => c.trim())
  console.log('[auth] Parsed cookies:', cookies)
  
  const nimbleAuthCookie = cookies.find(c => c.startsWith('nimble-auth='))
  console.log('[auth] Found nimble-auth cookie:', nimbleAuthCookie)
  
  if (!nimbleAuthCookie) {
    console.log('[auth] No nimble-auth cookie found')
    return null
  }
  
  const token = nimbleAuthCookie.split('=')[1]
  console.log('[auth] Extracted token:', token ? `${token.substring(0, 20)}...` : 'null')
  
  if (!token) {
    console.log('[auth] No token in cookie')
    return null
  }
  
  // Verify JWT using public key
  const publicKey = import.meta.env.NIMBLE_JWT_PUBLIC_KEY
  if (!publicKey) {
    console.warn('[auth] NIMBLE_JWT_PUBLIC_KEY not configured in vault')
    return null
  }
  
  console.log('[auth] Public key available, verifying JWT...')
  
  try {
    const result = verifyNimbleJWT(token, publicKey)
    console.log('[auth] JWT verification successful:', result)
    return result
  } catch (error) {
    console.error('[auth] JWT verification failed:', error)
    return null
  }
}

export function getAuthFromCookieSafe(cookieHeader: string | null): NimbleJWT | null {
  // At build time, environment variables may not be available, so return null safely
  if (typeof import.meta.env === 'undefined' || !import.meta.env.NIMBLE_JWT_PUBLIC_KEY) {
    return null
  }
  
  return getAuthFromCookie(cookieHeader)
}