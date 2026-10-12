import type { NextRequest } from "next/server";
export function isTrustedRequest(request: NextRequest): boolean {
  try {
    return (
      request.headers.get("origin") ===
      new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin
    );
  } catch {
    return false;
  }
}
