import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { provider } = await request.json()
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ url: data.url })
}