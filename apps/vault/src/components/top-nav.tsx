'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getPortalUrl } from '@/lib/portal-url'

interface User {
  id: string
  email?: string
  tags?: string[]
}

interface TopNavProps {
  onMenuClick?: () => void
}

export function TopNav({ onMenuClick }: TopNavProps = {}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkAuthStatus()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[TopNav] Auth state changed:', event, !!session)
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            tags: session.user.app_metadata?.tags || []
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log('[TopNav] Checking Supabase auth status...')
      console.log('[TopNav] Available cookies:', document.cookie)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()

      console.log('[TopNav] Supabase session:', session)
      console.log('[TopNav] Supabase user:', user)
      
      if (error) {
        console.error('[TopNav] Supabase session error:', error)
        return
      }

      if (session?.user) {
        console.log('[TopNav] Supabase user found:', {
          id: session.user.id,
          email: session.user.email,
          last_sign_in_at: session.user.last_sign_in_at
        })

        setUser({
          id: session.user.id,
          email: session.user.email,
          tags: session.user.app_metadata?.tags || []
        })
      } else {
        console.log('[TopNav] No Supabase session found')
      }
    } catch (error) {
      console.error('[TopNav] Failed to check Supabase auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    // Redirect to portal login
    window.location.href = getPortalUrl()
  }

  const handleLogout = async () => {
    console.log('[TopNav] Logging out...')
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return (
      <nav className="bg-black text-white">
        <div className="max-w-[120rem] mx-auto px-12 py-2.5 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold">Nimble</h1>
              <span className="ml-2 text-sm text-white/70">Vault</span>
            </div>
            <div className="h-9 w-20 bg-white/20 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-black text-white">
      <div className="max-w-[120rem] mx-auto px-12 py-2.5 lg:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold">Nimble</h1>
              <span className="ml-2 text-sm text-white/70">Vault</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-white/80">
                  Welcome, {user.email || `User ${user.id.slice(0, 8)}`}
                  {user.tags && user.tags.length > 0 && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                      {user.tags.join(', ')}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-white border-white/30 hover:bg-white/10">
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin} className="bg-primary text-white hover:bg-destructive">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}