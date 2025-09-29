import { createNimbleJWT, verifyNimbleJWT, hasTag, hasAnyTag, hasAllTags } from '@nimble/shared-auth'
import { UserTag } from '@/types/auth'

export function createNimbleJWTForPortal(userId: string, userTags: UserTag[]): string {
  const privateKey = process.env.NIMBLE_JWT_PRIVATE_KEY!
  return createNimbleJWT(userId, userTags, privateKey)
}

export function verifyNimbleJWTForPortal(token: string) {
  const publicKey = process.env.NIMBLE_JWT_PUBLIC_KEY!
  return verifyNimbleJWT(token, publicKey)
}

// Re-export the tag checking functions
export { hasTag, hasAnyTag, hasAllTags }