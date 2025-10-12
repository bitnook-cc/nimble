import { getUserTags } from './access'
import { public as publicContent, patron as patronContent, purchased as purchasedContent } from '#site/content'
import type { PublicContent, PatronContent, PurchasedContent } from '#site/content'

export interface AccessibleContent {
  title: string
  permalink: string
  category?: string
  access?: string[]
  order: number
  description?: string
  readingTime?: number
}

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
    ...publicContent.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      category: doc.category || 'uncategorized',
      access: undefined, // Public content has no access restrictions
      order: doc.order,
      description: doc.description,
      readingTime: doc.readingTime
    })),
    ...patronContent.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category || 'patron',
      access: item.access,
      order: item.order,
      description: item.description,
      readingTime: item.readingTime
    })),
    ...purchasedContent.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category || 'purchased',
      access: item.access,
      order: item.order,
      description: item.description,
      readingTime: item.readingTime
    }))
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
 * Get accessible public content
 */
export async function getAccessiblePublicContent(): Promise<PublicContent[]> {
  // Public content has no access restrictions, so just return all
  return publicContent
}

/**
 * Get accessible patron content
 */
export async function getAccessiblePatronContent(): Promise<PatronContent[]> {
  return filterAccessibleContent(patronContent)
}

/**
 * Get accessible purchased content
 */
export async function getAccessiblePurchasedContent(): Promise<PurchasedContent[]> {
  return filterAccessibleContent(purchasedContent)
}
