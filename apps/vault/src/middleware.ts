import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  console.log('[Middleware] Request pathname:', request.nextUrl.pathname)
  console.log('[Middleware] basePath:', basePath)

  // Only apply middleware if basePath is configured
  if (!basePath) {
    console.log('[Middleware] No basePath configured, passing through')
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // If the path doesn't start with the basePath, rewrite it
  if (!pathname.startsWith(basePath)) {
    const url = request.nextUrl.clone()
    url.pathname = `${basePath}${pathname}`
    console.log('[Middleware] Rewriting', pathname, 'to', url.pathname)
    return NextResponse.rewrite(url)
  }

  console.log('[Middleware] Path already has basePath, passing through')
  return NextResponse.next()
}
