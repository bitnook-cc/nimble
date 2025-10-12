'use client'

import { User } from '@supabase/supabase-js'
import { ArrowLeft, CheckCircle, Link as LinkIcon, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SettingsContentProps {
  user: User
}

interface LinkedAccount {
  provider: string
  name: string
  icon: React.ReactNode
  isLinked: boolean
  canUnlink: boolean // Can't unlink if it's your only auth method
}

export function SettingsContent({ user: initialUser }: SettingsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLinking, setIsLinking] = useState<string | null>(null)
  const [showLinkedToast, setShowLinkedToast] = useState(false)
  const [linkedProvider, setLinkedProvider] = useState('')
  const [user, setUser] = useState(initialUser)

  // Refresh user data when returning from linking flow
  useEffect(() => {
    const linked = searchParams.get('linked')
    if (linked) {
      // Refresh user data to get latest metadata
      fetch('/api/auth/user')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user)
          }
        })
        .catch(error => {
          console.error('Failed to refresh user data:', error)
        })

      setLinkedProvider(linked)
      setShowLinkedToast(true)

      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('linked')
      window.history.replaceState({}, '', url.toString())

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowLinkedToast(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const userTags = (user.app_metadata?.tags || []) as string[]
  const linkedProviders = (user.app_metadata?.providers || []) as string[]

  // Get identities from user to see actual linked OAuth providers
  const identities = user.identities || []
  const identityProviders = identities.map(i => i.provider)

  // Check for Patreon linking status from app_metadata
  const hasPatreonId = !!user.app_metadata?.patreon_id
  const hasPatreonToken = !!user.app_metadata?.patreon_access_token

  console.log('User metadata debug:', {
    identityProviders,
    linkedProviders,
    hasPatreonId,
    hasPatreonToken,
    appMetadata: user.app_metadata,
  })

  const accounts: LinkedAccount[] = [
    {
      provider: 'google',
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      isLinked: identityProviders.includes('google'),
      canUnlink: identityProviders.length > 1 || hasPatreonToken,
    },
    {
      provider: 'discord',
      name: 'Discord',
      icon: (
        <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 24 24">
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.082.082 0 0 0 .031.056 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 14.23 14.23 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.055c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.068-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
        </svg>
      ),
      isLinked: identityProviders.includes('discord'),
      canUnlink: identityProviders.length > 1 || hasPatreonToken,
    },
    {
      provider: 'patreon',
      name: 'Patreon',
      icon: (
        <svg className="w-5 h-5" fill="#FF424D" viewBox="0 0 24 24">
          <path d="M14.999 24c2.766 0 5.001-2.24 5.001-5.003 0-2.766-2.235-5.007-5.001-5.007-2.769 0-5.006 2.241-5.006 5.007C9.993 21.76 12.23 24 14.999 24zM5.604 18.471c-.059.293-.059.59 0 .883.12.585.474 1.11.99 1.47.516.36 1.152.52 1.785.448.633-.072 1.222-.378 1.655-.86.432-.482.677-1.104.687-1.748.01-.644-.223-1.273-.653-1.768-.43-.495-1.012-.815-1.642-.9-.63-.085-1.27.063-1.799.417-.529.354-.906.857-1.058 1.414l-.959-.583a3.78 3.78 0 0 1 1.403-1.876 3.666 3.666 0 0 1 2.387-.554c.836.113 1.601.507 2.178 1.123.577.616.925 1.412.991 2.267.066.855-.168 1.709-.665 2.43-.497.721-1.224 1.257-2.07 1.526-.846.269-1.758.257-2.598-.034-.84-.291-1.553-.846-2.031-1.581-.014-.022-.027-.044-.04-.067L5.58 18.426l.024.045z"/>
        </svg>
      ),
      isLinked: hasPatreonToken, // Check for actual token presence
      canUnlink: true, // Patreon is always unlinkable as it's not a primary auth method
    },
  ]

  const handleLinkAccount = async (provider: string) => {
    setIsLinking(provider)

    try {
      if (provider === 'patreon') {
        // Redirect to Patreon linking flow
        const response = await fetch('/api/auth/patreon/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const { url, error } = await response.json()

        if (error) {
          console.error('Link error:', error)
          setIsLinking(null)
          return
        }

        window.location.href = url
      } else {
        // For Google/Discord, use Supabase OAuth
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        })

        const { url, error } = await response.json()

        if (error) {
          console.error('Link error:', error)
          setIsLinking(null)
          return
        }

        window.location.href = url
      }
    } catch (error) {
      console.error('Failed to link account:', error)
      setIsLinking(null)
    }
  }

  const handleUnlinkAccount = async (provider: string) => {
    // TODO: Implement unlink functionality
    console.log('Unlink account:', provider)
  }

  return (
    <div>
      {/* Success Toast */}
      {showLinkedToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex items-center gap-3 min-w-[300px]">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-slate-900">Account linked!</p>
              <p className="text-sm text-slate-600">
                {linkedProvider.charAt(0).toUpperCase() + linkedProvider.slice(1)} account successfully connected
              </p>
            </div>
            <button
              onClick={() => setShowLinkedToast(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-lg text-slate-600">
            Manage your account and linked services
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Profile Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Email:</span>
              <span className="text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">User ID:</span>
              <span className="text-slate-900 font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-slate-600">Tags:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {userTags.length > 0 ? (
                  userTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Accounts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Linked Accounts</h2>
          <p className="text-sm text-slate-600 mb-6">
            Connect your accounts to access additional features and benefits
          </p>

          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.provider}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">{account.icon}</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-900">{account.name}</p>
                    <p className="text-xs text-slate-500">
                      {account.isLinked ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {account.isLinked ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {account.canUnlink && (
                        <button
                          onClick={() => handleUnlinkAccount(account.provider)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Unlink
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleLinkAccount(account.provider)}
                      disabled={isLinking !== null}
                      className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLinking === account.provider ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <LinkIcon className="w-4 h-4 mr-2" />
                      )}
                      Link Account
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
