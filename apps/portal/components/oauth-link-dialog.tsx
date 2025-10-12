'use client'

import { useEffect, useState, useRef } from 'react'
import { Spinner } from './ui/spinner'

interface OAuthLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  provider: string
  oauthUrl: string
}

export function OAuthLinkDialog({ isOpen, onClose, provider, oauthUrl }: OAuthLinkDialogProps) {
  const [isWaiting, setIsWaiting] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Open popup window
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    popupRef.current = window.open(
      oauthUrl,
      `oauth-${provider}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,menubar=no,resizable=yes,scrollbars=yes`
    )

    if (!popupRef.current) {
      alert('Popup blocked! Please allow popups for this site.')
      onClose()
      return
    }

    setIsWaiting(true)

    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      // Security: check origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'oauth-complete') {
        // Close popup
        if (popupRef.current) {
          popupRef.current.close()
        }

        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }

        setIsWaiting(false)

        // Reload the page to refresh linked accounts
        window.location.reload()
      }
    }

    window.addEventListener('message', handleMessage)

    // Poll to detect if user closed the popup manually
    pollIntervalRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
        setIsWaiting(false)
        onClose()
      }
    }, 500)

    return () => {
      window.removeEventListener('message', handleMessage)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }
  }, [isOpen, oauthUrl, provider, onClose])

  if (!isOpen || !isWaiting) return null

  return (
    <>
      {/* Backdrop - lighter to indicate background state */}
      <div className="fixed inset-0 bg-black/20 z-40" />

      {/* Status indicator */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-8 text-center min-w-[300px]">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Linking {provider.charAt(0).toUpperCase() + provider.slice(1)} Account
          </h3>
          <p className="text-sm text-slate-600">
            Complete the authentication in the popup window
          </p>
        </div>
      </div>
    </>
  )
}
