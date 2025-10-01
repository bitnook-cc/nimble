import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient(request: Request): SupabaseClient {
  const response = new Response()
  
  return createServerClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL!,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return []
          
          return cookieHeader.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=')
            return {
              name,
              value: rest.join('=')
            }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append('Set-Cookie', `${name}=${value}; ${options}`)
          })
        },
      },
    }
  )
}