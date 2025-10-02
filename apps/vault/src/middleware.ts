import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  console.log('[Middleware] Request URL:', request.url)
  console.log('[Middleware] Request pathname:', request.nextUrl.pathname)
  console.log('[Middleware] Request basepath:', request.nextUrl.basePath)
  console.log('[Middleware] basePath:', basePath)

  // Only apply middleware if basePath is configured
  if (!basePath) {
    console.log('[Middleware] No basePath configured, passing through')
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Check if the pathname (which doesn't include basePath in Next.js) needs the basePath prepended
  // When deployed at nimble-vault.vercel.app without basePath, pathname will be the raw path
  // When accessed via portal with basePath, Next.js strips it before middleware sees it
  // So we always need to rewrite to include basePath for internal routing
  const url = request.nextUrl.clone()

  // Only rewrite if the pathname doesn't already start with basePath
  // (though Next.js typically strips basePath before middleware)
  if (!pathname.startsWith(basePath)) {
    url.pathname = `${basePath}${pathname}`
    console.log('[Middleware] Rewriting', pathname, 'to', url.pathname)
    return NextResponse.rewrite(url)
  }

  console.log('[Middleware] Path already has basePath, passing through')
  return NextResponse.next()
}
