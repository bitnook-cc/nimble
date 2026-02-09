/**
 * Explicitly defined types for vault content bundles
 * These match the output of the Velite transforms
 */

// Metadata bundle - for navigation (minimal)
export interface ContentMeta {
  title: string
  category?: string
  slug: string
  permalink: string
  access?: string[]
}

// Search bundle - for fuzzy search (includes content preview)
export interface ContentSearch extends ContentMeta {
  description?: string
  searchBody?: string
  readingTime: number
}

// Full content bundle - for page rendering (everything)
export interface FullContent extends ContentMeta {
  description?: string
  category?: string
  order: number
  tags: string[]
  content: string  // Compiled MDX
  raw: string      // Raw markdown
  toc: Array<{
    title: string
    url: string
    items: Array<{
      title: string
      url: string
      items: any[]
    }>
  }>
  metadata: Record<string, any>
  originalSlug: string
  readingTime: number
}
