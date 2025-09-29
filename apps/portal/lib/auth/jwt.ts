import jwt from 'jsonwebtoken'
import { NimbleJWT, UserTag } from '@/types/auth'

export function createNimbleJWT(userId: string, userTags: UserTag[]): string {
  const payload: Omit<NimbleJWT, 'iss' | 'aud' | 'exp' | 'iat'> & {
    iss: string
    aud: string[]
    exp: number
    iat: number
  } = {
    sub: userId,
    iss: 'nimble-portal',
    aud: ['vault', 'monsters', 'dice'],
    tags: userTags.map(t => t.tag_name),
    tag_expires: userTags.reduce((acc, t) => {
      if (t.expires_at) {
        acc[t.tag_name] = new Date(t.expires_at).getTime() / 1000
      }
      return acc
    }, {} as Record<string, number>),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hour expiry
    iat: Math.floor(Date.now() / 1000),
  }

  return jwt.sign(payload, process.env.NIMBLE_JWT_SECRET!)
}

export function verifyNimbleJWT(token: string): NimbleJWT | null {
  try {
    return jwt.verify(token, process.env.NIMBLE_JWT_SECRET!) as NimbleJWT
  } catch {
    return null
  }
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