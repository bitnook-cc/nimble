
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PortalHome } from '@/components/portal-home'
import { LandingPage } from '@/components/landing-page'
import { Header } from '@/components/header'
import { LoginSuccessToast } from '@/components/login-success-toast'
import { ErrorBoundary } from '@/components/error-boundary'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
          </div>
        }>
          <Header user={user} />
          {user ? <PortalHome user={user} /> : <LandingPage />}
          <LoginSuccessToast />
        </Suspense>
        <Analytics />
      </div>
    </ErrorBoundary>
  )
}