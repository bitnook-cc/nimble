import jwt from 'jsonwebtoken'
import type { NimbleJWT, AuthUser } from './types.js'

export function verifyNimbleJWT(token: string, publicKey: string): NimbleJWT | null {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as NimbleJWT
  } catch {
    return null
  }
}

export function createNimbleJWT(userId: string, userTags: string[], privateKey: string): string {
  const payload: Omit<NimbleJWT, 'iss' | 'aud' | 'exp' | 'iat'> & {
    iss: string
    aud: string[]
    exp: number
    iat: number
  } = {
    sub: userId,
    iss: 'nimble-portal',
    aud: ['vault', 'monsters', 'dice'],
    tags: userTags,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hour expiry
    iat: Math.floor(Date.now() / 1000),
  }

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
}

export function hasTag(auth: NimbleJWT, tag: string): boolean {
  if (!auth.tags.includes(tag)) return false
  
  // Check if tag has expired
  if (auth.tag_expires?.[tag] && auth.tag_expires[tag] < Date.now() / 1000) {
    return false
  }
  
  return true
}

export function hasAnyTag(auth: NimbleJWT, tags: string[]): boolean {
  return tags.some(tag => hasTag(auth, tag))
}

export function hasAllTags(auth: NimbleJWT, tags: string[]): boolean {
  return tags.every(tag => hasTag(auth, tag))
}

export function extractUserFromJWT(auth: NimbleJWT): AuthUser {
  return {
    id: auth.sub,
    tags: auth.tags
  }
}