import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { createNimbleJWT } from '@/lib/auth/jwt'
import { UserTag } from '@/types/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Fetch user tags from database
      const { data: userTags } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', data.user.id)
      
      // Create custom JWT with tags
      const nimbleToken = createNimbleJWT(data.user.id, userTags as UserTag[] || [])
      
      // Set the JWT cookie using Next.js cookies API
      const cookieStore = await cookies()
      cookieStore.set('nimble-auth', nimbleToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.nimble.game' : 'localhost',
        path: '/',
        maxAge: 86400 // 24 hours
      })
      
      // Use Next.js redirect instead of Response.redirect
      redirect(`${next}`)
    }
  }

  // Return the user to an error page with instructions
  redirect('/auth/auth-code-error')
}