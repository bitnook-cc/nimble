'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'

export function LoginSuccessToast() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const loginSuccess = searchParams.get('login') === 'success'

    if (loginSuccess) {
      setShow(true)

      // Clean up URL immediately
      const url = new URL(window.location.href)
      url.searchParams.delete('login')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    if (show) {
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShow(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex items-center gap-3 min-w-[300px]">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-slate-900">Successfully logged in!</p>
          <p className="text-sm text-slate-600">Welcome back</p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
