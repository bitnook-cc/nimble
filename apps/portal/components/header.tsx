'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Settings, LogOut, LogIn } from 'lucide-react'
import { LoginDialog } from './login-dialog'

interface HeaderProps {
  user?: User | null
}

export function Header({ user }: HeaderProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.reload()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      <header className="bg-black text-white">
        <div className="max-w-[120rem] mx-auto px-12 py-2.5 lg:py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold">Nimble</h1>
              <span className="ml-2 text-sm text-white/70">Portal</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="text-sm text-white/80">
                    Welcome, {user.email}
                  </div>
                  <button
                    onClick={() => window.location.href = '/settings'}
                    aria-label="Open account settings"
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <Settings className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleLogout}
                    aria-label="Sign out of your account"
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginDialog(true)}
                  className="flex items-center px-6 py-2 text-sm font-medium text-white bg-primary rounded-nimble-button hover:bg-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />
    </>
  )
}
