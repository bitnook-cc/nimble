import { getUserTags } from './access'
import { publicMeta, patronMeta, purchasedMeta } from '#site/content'
import type { ContentMeta } from '@/types/content'

export type AccessibleContent = ContentMeta

/**
 * Check if a content item is accessible to the current user
 */
export async function isContentAccessible(accessTags?: string[]): Promise<boolean> {
  const userTags = await getUserTags()

  // Test tag can see everything
  if (userTags.includes('test')) {
    return true
  }

  // Public content (no access tags) is always accessible
  if (!accessTags || accessTags.length === 0) {
    return true
  }

  // Check if user has any of the required access tags
  return accessTags.some(tag => userTags.includes(tag))
}

/**
 * Filter content based on user's access tags
 */
export async function filterAccessibleContent<T extends { access?: string[] }>(
  content: T[]
): Promise<T[]> {
  const userTags = await getUserTags()

  return content.filter(item => {
    // Test tag can see everything
    if (userTags.includes('test')) {
      return true
    }
    // Public content (no access) is visible to everyone
    if (!item.access || item.access.length === 0) {
      return true
    }
    // Check if user has any required tags
    return item.access.some(access => userTags.includes(access))
  })
}

/**
 * Get all accessible content for the current user
 */
export async function getAllAccessibleContent(): Promise<AccessibleContent[]> {
  const userTags = await getUserTags()

  const allContent: AccessibleContent[] = [
    ...(publicMeta as ContentMeta[]),
    ...(patronMeta as ContentMeta[]),
    ...(purchasedMeta as ContentMeta[])
  ]

  // Filter content based on user access
  return allContent.filter(item => {
    // Test tag can see everything
    if (userTags.includes('test')) {
      return true
    }
    // Public content is visible to everyone
    if (!item.access || item.access.length === 0) {
      return true
    }
    // Check if user has required tags
    return item.access.some(access => userTags.includes(access))
  })
}

/**
 * Get accessible public content metadata
 */
export async function getAccessiblePublicContent(): Promise<ContentMeta[]> {
  // Public content has no access restrictions, so just return all
  return publicMeta as ContentMeta[]
}

/**
 * Get accessible patron content metadata
 */
export async function getAccessiblePatronContent(): Promise<ContentMeta[]> {
  return filterAccessibleContent(patronMeta as ContentMeta[])
}

/**
 * Get accessible purchased content metadata
 */
export async function getAccessiblePurchasedContent(): Promise<ContentMeta[]> {
  return filterAccessibleContent(purchasedMeta as ContentMeta[])
}
