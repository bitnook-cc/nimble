import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const basePathConfig = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // Only apply middleware if basePath is configured
  if (!basePathConfig) {
    return NextResponse.next()
  }

  const { basePath, pathname } = request.nextUrl

  // Check if the pathname (which doesn't include basePath in Next.js) needs the basePath prepended
  // When deployed at nimble-vault.vercel.app without basePath, pathname will be the raw path
  // When accessed via portal with basePath, Next.js strips it before middleware sees it
  // So we always need to rewrite to include basePath for internal routing
  

  // Only rewrite if the pathname doesn't already start with basePath
  // (though Next.js typically strips basePath before middleware)
  if (basePath !== basePathConfig) {
    const url = request.nextUrl.clone()
    url.pathname = `${basePathConfig}${pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}
