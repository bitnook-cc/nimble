'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { Spinner } from './ui/spinner'

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleLogin = async (provider: 'google' | 'discord') => {
    setIsLoading(provider)
    setShowSuccess(false)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      const { url, error } = await response.json()

      if (error) {
        console.error('Login error:', error)
        setIsLoading(null)
        return
      }

      // Redirect to OAuth provider immediately (spinner stays visible)
      window.location.href = url
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 relative">
          {/* Full-screen loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center z-10">
              {showSuccess ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                  <p className="text-slate-700 font-medium text-lg">Success!</p>
                </>
              ) : (
                <>
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-slate-700 font-medium text-lg">Logging in...</p>
                </>
              )}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
            <button
              onClick={onClose}
              disabled={isLoading !== null}
              className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-slate-600 mb-6 text-center">
              Sign in to access your characters and save your progress
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleLogin('google')}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-3" />
                ) : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <button
                onClick={() => handleLogin('discord')}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-md shadow-sm bg-[#5865F2] text-sm font-medium text-white hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865F2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'discord' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.082.082 0 0 0 .031.056 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 14.23 14.23 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.055c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.068-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                  </svg>
                )}
                Continue with Discord
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Coming Soon</span>
                </div>
              </div>

              <button
                disabled={true}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-md shadow-sm bg-slate-100 text-sm font-medium text-slate-400 cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.999 24c2.766 0 5.001-2.24 5.001-5.003 0-2.766-2.235-5.007-5.001-5.007-2.769 0-5.006 2.241-5.006 5.007C9.993 21.76 12.23 24 14.999 24zM5.604 18.471c-.059.293-.059.59 0 .883.12.585.474 1.11.99 1.47.516.36 1.152.52 1.785.448.633-.072 1.222-.378 1.655-.86.432-.482.677-1.104.687-1.748.01-.644-.223-1.273-.653-1.768-.43-.495-1.012-.815-1.642-.9-.63-.085-1.27.063-1.799.417-.529.354-.906.857-1.058 1.414l-.959-.583a3.78 3.78 0 0 1 1.403-1.876 3.666 3.666 0 0 1 2.387-.554c.836.113 1.601.507 2.178 1.123.577.616.925 1.412.991 2.267.066.855-.168 1.709-.665 2.43-.497.721-1.224 1.257-2.07 1.526-.846.269-1.758.257-2.598-.034-.84-.291-1.553-.846-2.031-1.581-.014-.022-.027-.044-.04-.067L5.58 18.426l.024.045z"/>
                </svg>
                Continue with Patreon
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
