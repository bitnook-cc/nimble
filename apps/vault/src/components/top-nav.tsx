'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  tags?: string[]
}

export function TopNav() {
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
    window.location.href = 'http://localhost:4000'
  }

  const handleLogout = async () => {
    console.log('[TopNav] Logging out...')
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return (
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-primary">
              Nimble RPG Vault
            </div>
            <div className="h-9 w-20 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-primary">
            Nimble RPG Vault
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Welcome, {user.email || `User ${user.id.slice(0, 8)}`}
                  {user.tags && user.tags.length > 0 && (
                    <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                      {user.tags.join(', ')}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}