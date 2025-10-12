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
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">Nimble</h1>
              <span className="ml-2 text-sm text-slate-500">Portal</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="text-sm text-slate-600">
                    Welcome, {user.email}
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600">
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-slate-600"
                    title="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginDialog(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
