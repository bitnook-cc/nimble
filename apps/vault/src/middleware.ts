import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // Only apply middleware if basePath is configured
  if (!basePath) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // If the path doesn't start with the basePath, rewrite it
  if (!pathname.startsWith(basePath)) {
    const url = request.nextUrl.clone()
    url.pathname = `${basePath}${pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}
