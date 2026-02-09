
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PortalHome } from '@/components/portal-home'
import { LandingPage } from '@/components/landing-page'
import { Header } from '@/components/header'
import { LoginSuccessToast } from '@/components/login-success-toast'
import { ErrorBoundary } from '@/components/error-boundary'
import { redirect } from 'next/navigation'
import { isValidReturnUrl } from '@/lib/security/url-validator'

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined

  // If user is authenticated and there's a returnTo URL, redirect them
  // Validate the URL to prevent open redirect attacks
  if (user && returnTo && isValidReturnUrl(returnTo)) {
    redirect(returnTo)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
          </div>
        }>
          <Header user={user} />
          {user ? <PortalHome user={user} /> : <LandingPage returnTo={returnTo} />}
          <LoginSuccessToast />
        </Suspense>
        <Analytics />
      </div>
    </ErrorBoundary>
  )
}