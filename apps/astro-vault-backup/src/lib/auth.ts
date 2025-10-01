import { createClient } from './supabase/server'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthInfo {
  user: User
  session: Session
  hasPatronAccess: boolean
}

export async function getAuthFromRequest(request: Request): Promise<AuthInfo | null> {
  console.log('[auth] getAuthFromRequest called')
  
  if (!import.meta.env.NEXT_PUBLIC_SUPABASE_URL || !import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[auth] Supabase environment variables not configured')
    return null
  }
  
  try {
    const supabase = createClient(request)
    
    // Get both session and user in one call for efficiency
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('[auth] Supabase session error:', sessionError.message)
      return null
    }
    
    if (!session?.user) {
      console.log('[auth] No active session or user')
      return null
    }
    
    const user = session.user
    console.log('[auth] Authenticated user:', {
      id: user.id,
      email: user.email,
      sessionExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'never'
    })
    
    // Check user metadata for patron status using the same logic as portal
    const userMetadata = user.user_metadata || {}
    const appMetadata = user.app_metadata || {}
    
    // Check for patron access in various metadata fields (matching portal logic)
    const hasPatronAccess = 
      appMetadata.patreon_patron === true ||
      appMetadata.subscription_tier === 'patron' ||
      appMetadata.tags?.includes('patreon-patron') ||
      appMetadata.tags?.includes('test') // Include test tag like portal
    
    console.log('[auth] User has patron access:', hasPatronAccess, {
      userTags: userMetadata.tags,
      appTags: appMetadata.tags,
      subscriptionTier: userMetadata.subscription_tier || appMetadata.subscription_tier
    })
    
    return {
      user,
      session,
      hasPatronAccess
    }
  } catch (error) {
    console.error('[auth] Error checking authentication:', error)
    return null
  }
}

export function getAuthFromRequestSafe(request: Request): Promise<AuthInfo | null> {
  // At build time, environment variables may not be available, so return null safely
  if (typeof import.meta.env === 'undefined' || 
      !import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
      !import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[auth] Build-time environment detected, skipping auth check')
    return Promise.resolve(null)
  }
  
  return getAuthFromRequest(request)
}

// Additional helper functions for session management
export async function refreshSessionIfNeeded(request: Request): Promise<AuthInfo | null> {
  try {
    const supabase = createClient(request)
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error || !session?.user) {
      console.log('[auth] Session refresh failed:', error?.message || 'No session')
      return null
    }
    
    console.log('[auth] Session refreshed successfully for user:', session.user.id)
    
    // Return auth info with refreshed session
    const authInfo = await getAuthFromRequest(request)
    return authInfo
  } catch (error) {
    console.error('[auth] Error refreshing session:', error)
    return null
  }
}

export function isSessionExpired(session: Session): boolean {
  if (!session.expires_at) return false
  return Date.now() / 1000 > session.expires_at
}

export function getSessionTimeRemaining(session: Session): number {
  if (!session.expires_at) return Infinity
  return Math.max(0, session.expires_at - Date.now() / 1000)
}