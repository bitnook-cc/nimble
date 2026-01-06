import Fuse from 'fuse.js'
import searchIndexData from '#site/search-index.json'
import type { SearchDocument } from '#site/search-index'

export interface SearchResult extends SearchDocument {
  score?: number
  matches?: any[]
}

interface FuseSearchResult {
  item: SearchDocument
  score?: number
  matches?: any[]
}

class SearchService {
  private fuse: Fuse<SearchDocument>
  private documents: SearchDocument[]

  constructor() {
    const { documents, index } = searchIndexData as any
    this.documents = documents

    // Initialize Fuse with pre-computed index for performance
    this.fuse = new Fuse(
      documents,
      {
        keys: [
          { name: 'title', weight: 2.0 },
          { name: 'tags', weight: 1.5 },
          { name: 'description', weight: 1.0 },
          { name: 'category', weight: 0.8 },
          { name: 'contentExcerpt', weight: 0.5 }
        ],
        threshold: 0.3, // Fuzzy matching tolerance (0.0 = perfect match, 1.0 = match anything)
        location: 0,
        distance: 100,
        minMatchCharLength: 2,
        shouldSort: true,
        includeScore: true,
        includeMatches: true, // For highlighting
        useExtendedSearch: false,
        getFn: Fuse.config.getFn,
        sortFn: (a, b) => (a.score || 0) - (b.score || 0)
      },
      Fuse.parseIndex(index)
    )
  }

  /**
   * Search for documents matching the query
   * @param query - Search query string
   * @param userTags - User access tags for filtering
   * @param limit - Maximum number of results to return
   * @returns Array of search results with scores and matches
   */
  search(query: string, userTags: string[] = [], limit: number = 20): SearchResult[] {
    if (!query || !query.trim()) {
      return []
    }

    // Perform the search
    const results = this.fuse.search(query, { limit: limit * 2 }) // Get more results for filtering

    // Filter by access control and map results
    const filteredResults = results
      .filter((result: FuseSearchResult) => this.hasAccess(result.item, userTags))
      .slice(0, limit)
      .map((result: FuseSearchResult) => ({
        ...result.item,
        score: result.score,
        matches: result.matches
      }))

    return filteredResults
  }

  /**
   * Quick search returning only basic info (for autocomplete)
   */
  quickSearch(query: string, userTags: string[] = [], limit: number = 8): SearchResult[] {
    if (!query || !query.trim()) {
      return []
    }

    // Use a higher threshold for quick search (more permissive)
    const quickResults = this.fuse.search(query, {
      limit: limit * 2,
    })

    return quickResults
      .filter((result: FuseSearchResult) => this.hasAccess(result.item, userTags))
      .slice(0, limit)
      .map((result: FuseSearchResult) => ({
        ...result.item,
        score: result.score,
        matches: result.matches
      }))
  }

  /**
   * Check if user has access to a document
   */
  private hasAccess(item: SearchDocument, userTags: string[]): boolean {
    // Test tag can see everything
    if (userTags.includes('test')) {
      return true
    }

    // Public content (no access array or empty) is visible to everyone
    if (!item.access || item.access.length === 0) {
      return true
    }

    // Check if user has any of the required access tags
    return item.access.some(tag => userTags.includes(tag))
  }

  /**
   * Get suggestions based on partial input (for autocomplete)
   */
  getSuggestions(partial: string, userTags: string[] = [], limit: number = 5): string[] {
    if (!partial || partial.length < 2) {
      return []
    }

    const results = this.quickSearch(partial, userTags, limit)
    return results.map(r => r.title)
  }

  /**
   * Get all accessible documents for a user (for browsing)
   */
  getAccessibleDocuments(userTags: string[] = []): SearchDocument[] {
    return this.documents.filter(doc => this.hasAccess(doc, userTags))
  }
}

// Export singleton instance
export const searchService = new SearchService()