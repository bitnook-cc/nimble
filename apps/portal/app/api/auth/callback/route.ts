import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { UserTag } from '@/types/auth'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    console.log('Auth callback processing:', {
      code: code ? 'present' : 'missing',
      origin,
      next,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV
    })
    
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Supabase auth exchange failed:', {
        error: error.message,
        code: error.status,
        origin,
        next,
        timestamp: new Date().toISOString()
      })
    }
    
    if (!error && data.user) {
      console.log('User authenticated successfully:', {
        userId: data.user.id,
        email: data.user.email,
        identities: data.user.identities?.length || 0,
        appMetadata: data.user.app_metadata,
        userMetadata: data.user.user_metadata
      })
      
      // Load admin user IDs from environment variable
      const adminUserIdsString = process.env.ADMIN_USER_IDS || ''
      const ADMIN_USER_IDS = adminUserIdsString
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)

      // Use Supabase's built-in user system - no custom tables needed!
      // Get user tags from app_metadata (managed by database functions/triggers)
      let userTags = (data.user.app_metadata?.tags || []) as UserTag[]

      // Check if user is an admin
      const isAdmin = ADMIN_USER_IDS.includes(data.user.id)

      // Only assign admin tags to admin users
      let tagsUpdated = false
      if (isAdmin) {
        if (!userTags.includes('test')) {
          userTags = ['test', ...userTags]
          tagsUpdated = true
        }
        if (!userTags.includes('admin')) {
          userTags = ['admin', ...userTags]
          tagsUpdated = true
        }
      } else {
        // Non-admin users: remove admin tags if they exist
        const allowedTags = userTags.filter(tag => !['test', 'admin'].includes(tag))
        if (allowedTags.length !== userTags.length) {
          userTags = allowedTags
          tagsUpdated = true
        }
      }

      if (tagsUpdated) {
        // Update user metadata with tags (requires service role key)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const { createClient: createServiceClient } = await import('@supabase/supabase-js')
            const serviceSupabase = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            await serviceSupabase.auth.admin.updateUserById(data.user.id, {
              app_metadata: {
                ...data.user.app_metadata,
                tags: userTags
              }
            })

            console.log('Updated user tags:', {
              userId: data.user.id,
              email: data.user.email,
              isAdmin,
              tags: userTags
            })
          } catch (updateError) {
            console.error('Failed to update user tags:', updateError)
            // Don't fail authentication if tag update fails
          }
        } else {
          console.warn('SUPABASE_SERVICE_ROLE_KEY not configured, cannot update user tags')
        }
      }
      
      // Use Next.js redirect with proper URL validation
      // Ensure we don't redirect to external domains in production
      const redirectPath = next.startsWith('/') ? next : '/'
      redirect(`${redirectPath}?login=success`)
    }
  }

  // Log detailed error information before redirecting
  console.error('Authentication callback failed:', {
    code: code ? 'present' : 'missing',
    origin,
    next,
    searchParams: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  })
  
  // Return the user to an error page with instructions
  redirect('/auth/auth-code-error')
}