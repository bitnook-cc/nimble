import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

interface PatreonTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}

interface PatreonUser {
  data: {
    id: string
    attributes: {
      email: string
      full_name: string
      image_url?: string
      is_email_verified: boolean
    }
  }
  included?: Array<{
    type: string
    id: string
    attributes: {
      patron_status?: string
      currently_entitled_amount_cents?: number
      lifetime_support_cents?: number
    }
  }>
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Patreon OAuth error:', error)
    redirect('/auth/auth-code-error')
  }

  if (!code) {
    console.error('No code provided from Patreon')
    redirect('/auth/auth-code-error')
  }

  const clientId = process.env.PATREON_CLIENT_ID
  const clientSecret = process.env.PATREON_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/patreon/callback`

  if (!clientId || !clientSecret) {
    console.error('Patreon OAuth not configured')
    redirect('/auth/auth-code-error')
  }

  try {
    // Get currently authenticated user from session
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      console.error('Not authenticated - cannot link Patreon account:', authError)
      redirect('/auth/auth-code-error')
    }

    const userId = currentUser.id

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Patreon token exchange failed:', errorText)
      redirect('/auth/auth-code-error')
    }

    const tokenData: PatreonTokenResponse = await tokenResponse.json()

    // Get user data from Patreon
    const userResponse = await fetch(
      'https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields[user]=email,full_name,image_url,is_email_verified&fields[member]=patron_status,currently_entitled_amount_cents,lifetime_support_cents',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    )

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('Patreon user fetch failed:', errorText)
      redirect('/auth/auth-code-error')
    }

    const userData: PatreonUser = await userResponse.json()
    const patreonUser = userData.data

    if (!patreonUser.attributes.is_email_verified) {
      console.error('Patreon email not verified')
      redirect('/auth/auth-code-error')
    }

    // Determine user tags based on Patreon membership
    const userTags: string[] = ['patreon']

    // Check if user has active membership
    const memberships = userData.included?.filter(item => item.type === 'member') || []
    const activeMembership = memberships.find(
      m => m.attributes.patron_status === 'active_patron'
    )

    if (activeMembership) {
      userTags.push('premium')

      // Add tier-based tags based on entitled amount
      const entitledCents = activeMembership.attributes.currently_entitled_amount_cents || 0
      if (entitledCents >= 1000) userTags.push('patreon-tier-3') // $10+
      else if (entitledCents >= 500) userTags.push('patreon-tier-2') // $5+
      else if (entitledCents >= 100) userTags.push('patreon-tier-1') // $1+
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      redirect('/auth/auth-code-error')
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current user data to merge with Patreon info
    const { data: existingUserData } = await serviceSupabase.auth.admin.getUserById(userId)
    const existingUser = existingUserData?.user

    if (!existingUser) {
      console.error('Unable to fetch current user data:', userId)
      redirect('/auth/auth-code-error')
    }

    // Get existing providers from identities
    const existingProviders = existingUser.identities?.map(i => i.provider) || []

    // Merge existing tags with new Patreon tags
    const existingTags = (existingUser.app_metadata?.tags || []) as string[]
    const mergedTags = Array.from(new Set([...existingTags, ...userTags]))

    // Update the current user with Patreon data
    await serviceSupabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...existingUser.app_metadata,
        tags: mergedTags,
        patreon_id: patreonUser.id,
        patreon_access_token: tokenData.access_token,
        patreon_refresh_token: tokenData.refresh_token,
        patreon_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        providers: Array.from(new Set([...existingProviders, 'patreon'])),
      },
      user_metadata: {
        ...existingUser.user_metadata,
        // Optionally update profile info from Patreon
        patreon_full_name: patreonUser.attributes.full_name,
        patreon_avatar_url: patreonUser.attributes.image_url,
      },
    })

    console.log('Linked Patreon account to current user:', {
      userId,
      patreonEmail: patreonUser.attributes.email,
      currentEmail: existingUser.email,
      mergedTags,
      providers: Array.from(new Set([...existingProviders, 'patreon'])),
    })
  } catch (error) {
    console.error('Patreon OAuth callback error:', error)
    redirect('/auth/auth-code-error')
  }

  // Redirect outside of try-catch (redirect throws internally in Next.js)
  redirect('/settings?linked=patreon')
}
