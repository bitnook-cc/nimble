/**
 * Get the portal URL for authentication redirects
 * @returns The portal URL from environment variable or localhost fallback
 */
export function getPortalUrl(): string {
  return process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:4000'
}
