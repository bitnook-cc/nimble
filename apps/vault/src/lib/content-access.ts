import { getUserTags } from './access'
import { docs, patron, type Doc, type PatronContent } from '#site/content'

export interface AccessibleContent {
  title: string
  permalink: string
  category?: string
  access: string[]
  order: number
  description?: string
  readingTime?: number
}

/**
 * Check if a content item is accessible to the current user
 */
export async function isContentAccessible(accessTags: string[]): Promise<boolean> {
  const userTags = await getUserTags()

  // Public content is always accessible
  if (accessTags.includes('public')) {
    return true
  }

  // Check if user has any of the required access tags
  return accessTags.some(tag => userTags.includes(tag))
}

/**
 * Filter content based on user's access tags
 */
export async function filterAccessibleContent<T extends { access: string[] }>(
  content: T[]
): Promise<T[]> {
  const userTags = await getUserTags()

  return content.filter(item =>
    item.access.some(access => userTags.includes(access) || access === 'public')
  )
}

/**
 * Get all accessible content for the current user
 */
export async function getAllAccessibleContent(): Promise<AccessibleContent[]> {
  const userTags = await getUserTags()

  const allContent: AccessibleContent[] = [
    ...docs.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      category: doc.category || 'uncategorized',
      access: doc.access,
      order: doc.order,
      description: doc.description,
      readingTime: doc.readingTime
    })),
    ...patron.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category || 'advanced',
      access: item.access,
      order: item.order,
      description: item.description,
      readingTime: item.readingTime
    }))
  ]

  // Filter content based on user access
  return allContent.filter(item =>
    item.access.some(access => userTags.includes(access) || access === 'public')
  )
}

/**
 * Get accessible docs (public content)
 */
export async function getAccessibleDocs(): Promise<Doc[]> {
  return filterAccessibleContent(docs)
}

/**
 * Get accessible patron content (premium content)
 */
export async function getAccessiblePatronContent(): Promise<PatronContent[]> {
  return filterAccessibleContent(patron)
}
