import { NextRequest } from 'next/server'

export async function POST(_request: NextRequest) {
  const clientId = process.env.PATREON_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/patreon/callback`

  if (!clientId) {
    return Response.json(
      { error: 'Patreon OAuth not configured' },
      { status: 500 }
    )
  }

  // Build Patreon OAuth URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'identity identity[email] identity.memberships',
  })

  const authUrl = `https://www.patreon.com/oauth2/authorize?${params.toString()}`

  return Response.json({ url: authUrl })
}
