export interface NimbleJWT {
  sub: string // User ID
  iss: string // Issuer (nimble-portal)
  aud: string[] // Valid audiences
  exp: number // Expiration timestamp
  iat: number // Issued at timestamp
  tags: string[] // User permissions/tags
  tag_expires?: Record<string, number> // Optional per-tag expiration
}

export interface UserTag {
  id: string
  user_id: string
  tag_name: string
  granted_at: string
  granted_by?: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface UserProfile {
  id: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}