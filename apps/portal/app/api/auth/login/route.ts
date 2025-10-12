import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { provider, returnTo } = await request.json()
  const supabase = await createClient()

  // Build redirect URL with returnTo parameter if present
  const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`)
  if (returnTo) {
    callbackUrl.searchParams.set('next', returnTo)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ url: data.url })
}