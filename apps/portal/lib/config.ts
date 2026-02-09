/**
 * Client-safe configuration
 *
 * Environment variables prefixed with NEXT_PUBLIC_ are safe for client-side use.
 * Never use process.env directly in client components.
 */

export const VAULT_URL = process.env.NEXT_PUBLIC_VAULT_URL || '/vault'
