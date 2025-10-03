import { createClient } from './supabase/server'

/**
 * Get the current user's tags from Supabase session
 * @returns Array of user tags, empty array if not authenticated
 */
export async function getUserTags(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return []
  }

  return session.user.app_metadata?.tags || []
}

/**
 * Check if the current user has a specific tag
 * @param tag - The tag to check for
 * @returns True if user has the tag, false otherwise
 */
export async function hasTag(tag: string): Promise<boolean> {
  const tags = await getUserTags()
  return tags.includes(tag)
}

/**
 * Check if the current user has premium access
 * @returns True if user has premium tag, false otherwise
 */
export async function hasPremiumAccess(): Promise<boolean> {
  return hasTag('premium')
}
