import { verifyNimbleJWT } from '@nimble/shared-auth'
import type { NimbleJWT } from '@nimble/shared-auth'

export function getAuthFromCookie(cookieHeader: string | null): NimbleJWT | null {
  if (!cookieHeader) return null
  
  // Parse nimble-auth cookie
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const nimbleAuthCookie = cookies.find(c => c.startsWith('nimble-auth='))
  
  if (!nimbleAuthCookie) return null
  
  const token = nimbleAuthCookie.split('=')[1]
  if (!token) return null
  
  // Verify JWT using public key
  const publicKey = import.meta.env.NIMBLE_JWT_PUBLIC_KEY
  if (!publicKey) {
    console.warn('NIMBLE_JWT_PUBLIC_KEY not configured in vault')
    return null
  }
  
  try {
    return verifyNimbleJWT(token, publicKey)
  } catch (error) {
    console.error('JWT verification failed:', error)
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