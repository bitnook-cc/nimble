export interface NimbleJWT {
  sub: string // User ID
  iss: string // Issuer (nimble-portal)
  aud: string[] // Valid audiences
  exp: number // Expiration timestamp
  iat: number // Issued at timestamp
  tags: string[] // User permissions/tags
  tag_expires?: Record<string, number> // Optional per-tag expiration
}

export type UserTag = string