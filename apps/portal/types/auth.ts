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

export interface PatreonTokens {
  access_token: string
  refresh_token: string
  expires_at: string // ISO timestamp
}

export interface PatreonUser {
  id: string
  email: string
  full_name: string
  image_url?: string
  is_email_verified: boolean
}

export interface PatreonMembership {
  patron_status: string
  currently_entitled_amount_cents: number
  lifetime_support_cents: number
}