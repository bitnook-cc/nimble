/**
 * URL Validator Utility
 *
 * Prevents open redirect attacks by validating return URLs.
 * Only allows relative paths that don't bypass validation.
 */

/**
 * Validates a return URL to prevent open redirect attacks
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe to redirect to, false otherwise
 *
 * Security checks:
 * - Must be a non-empty string
 * - Must start with `/` (relative path only)
 * - Must not start with `//` (protocol-relative URL)
 * - Must not contain `://` (absolute URL)
 * - Must not start with blocklisted paths
 */
export function isValidReturnUrl(url: string): boolean {
  // Check for empty or non-string values
  if (!url || typeof url !== 'string') {
    return false
  }

  // Must start with `/` (relative path)
  if (!url.startsWith('/')) {
    return false
  }

  // Reject protocol-relative URLs (//) and path traversal
  if (url.startsWith('//') || url.includes('://')) {
    return false
  }

  // Blocklist dangerous paths
  const blocklist = ['/api/', '/admin/', '/auth/']
  if (blocklist.some(path => url.startsWith(path))) {
    return false
  }

  return true
}
