import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return Response.json(
        { 
          error: 'Not authenticated',
          login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
        },
        { status: 401 }
      )
    }

    // Get user tags from app_metadata (managed by Supabase)
    const userTags = session.user.app_metadata?.tags || []

    return Response.json({
      user_id: session.user.id,
      tags: userTags,
      expires_at: new Date(session.expires_at! * 1000).toISOString(),
      cached_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour cache suggestion
    })
  } catch (error) {
    console.error('User tags API error:', error)
    return Response.json(
      { 
        error: 'Internal server error',
        login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      },
      { status: 500 }
    )
  }
}