'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { public as publicContent, patron as patronContent, purchased as purchasedContent } from '#site/content'
import Fuse, { FuseResult, FuseResultMatch, RangeTuple } from 'fuse.js'

interface SearchResult {
  title: string
  permalink: string
  category?: string
  description?: string
  access?: string[]
  searchBody?: string
}

interface SearchBarProps {
  userTags?: string[]
  onResultSelect?: (result: SearchResult) => void
}

type FuseSearchResult = FuseResult<SearchResult>

export function SearchBar({ userTags = [], onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FuseSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combine all content for searching
  const allContent: SearchResult[] = useMemo(() => [
    ...publicContent.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      category: doc.category,
      description: doc.description,
      access: undefined, // Public content has no access restrictions
      searchBody: doc.searchBody
    })),
    ...patronContent.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category,
      description: item.description,
      access: item.access,
      searchBody: item.searchBody
    })),
    ...purchasedContent.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category,
      description: item.description,
      access: item.access,
      searchBody: item.searchBody
    }))
  ], [])

  // Filter content based on user access
  const accessibleContent = useMemo(() => allContent.filter(item => {
    // Test tag can see everything
    if (userTags.includes('test')) {
      return true
    }
    // Public content (no access array or undefined) is visible to everyone
    if (!item.access) {
      return true
    }
    // Check if user has any of the required tags
    return item.access.some(access => userTags.includes(access))
  }), [allContent, userTags])

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => new Fuse(accessibleContent, {
    keys: [
      { name: 'title', weight: 2 }, // Title is most important
      { name: 'description', weight: 1.5 },
      { name: 'category', weight: 1 },
      { name: 'searchBody', weight: 0.5 } // Body content is less important
    ],
    threshold: 0.4, // Balance between fuzzy and precise (0 = exact, 1 = match anything)
    distance: 100, // How far to search for pattern match
    minMatchCharLength: 2, // Minimum characters to start matching
    includeScore: true, // Include match score for sorting
    includeMatches: true, // Include matched text for highlighting
    ignoreLocation: true, // Search entire strings, not just beginning
    useExtendedSearch: false
  }), [accessibleContent])

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    // Use Fuse.js for fuzzy search
    const searchResults = fuse.search(searchQuery, { limit: 12 })
    setResults(searchResults)
  }, [fuse])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 200) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: FuseSearchResult) => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onResultSelect?.(result.item)

    // Navigate to result
    window.location.href = result.item.permalink
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  // Helper to highlight matched text
  const highlightMatch = (text: string, matches?: readonly FuseResultMatch[], fieldKey?: string) => {
    if (!matches || !text) return text

    // Find matches for this specific field
    const fieldMatches = matches.filter(m => m.key === fieldKey)
    if (fieldMatches.length === 0) return text

    const indices = fieldMatches.flatMap(m => Array.from(m.indices)) as RangeTuple[]
    if (indices.length === 0) return text

    // Sort indices by start position
    const sortedIndices = [...indices].sort((a, b) => a[0] - b[0])

    // Build highlighted text
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    sortedIndices.forEach(([start, end], idx) => {
      // Add non-highlighted text before match
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start))
      }
      // Add highlighted match
      parts.push(
        <mark key={idx} className="bg-yellow-200 text-foreground font-medium">
          {text.substring(start, end + 1)}
        </mark>
      )
      lastIndex = end + 1
    })

    // Add remaining text after last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return <>{parts}</>
  }

  // Helper to get search snippet from body match
  const getSearchSnippet = (result: FuseSearchResult): React.ReactNode | null => {
    if (!result.matches || !result.item.searchBody) return null

    const bodyMatches = result.matches.filter(m => m.key === 'searchBody')
    if (bodyMatches.length === 0) return null

    const match = bodyMatches[0]
    const indices = match.indices[0]
    if (!indices) return null

    const [start, end] = indices
    const text = result.item.searchBody

    // Extract snippet around match (50 chars before and after)
    const snippetStart = Math.max(0, start - 50)
    const snippetEnd = Math.min(text.length, end + 50)
    let snippet = text.substring(snippetStart, snippetEnd)

    // Add ellipsis if truncated
    if (snippetStart > 0) snippet = '...' + snippet
    if (snippetEnd < text.length) snippet = snippet + '...'

    // Highlight the matched portion within the snippet
    const relativeStart = start - snippetStart + (snippetStart > 0 ? 3 : 0)
    const relativeEnd = end - snippetStart + (snippetStart > 0 ? 3 : 0)

    return (
      <>
        {snippet.substring(0, relativeStart)}
        <mark className="bg-yellow-200 text-foreground font-medium">
          {snippet.substring(relativeStart, relativeEnd + 1)}
        </mark>
        {snippet.substring(relativeEnd + 1)}
      </>
    )
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search vault..."
          className="
            w-full pl-10 pr-10 py-2
            bg-white border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder-muted-foreground text-foreground
          "
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-1
          bg-white border border-border rounded-lg shadow-lg
          max-h-96 overflow-y-auto z-50
        ">
          {results.map((result, idx) => {
            const snippet = getSearchSnippet(result)
            const hasBodyMatch = snippet !== null

            return (
              <button
                key={`${result.item.permalink}-${idx}`}
                onClick={() => handleResultClick(result)}
                className="
                  w-full text-left p-3 hover:bg-accent
                  border-b border-border last:border-b-0
                  focus:outline-none focus:bg-accent
                "
              >
                <div className="font-medium text-foreground">
                  {highlightMatch(result.item.title, result.matches, 'title')}
                </div>
                {result.item.description && !hasBodyMatch && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {highlightMatch(result.item.description, result.matches, 'description')}
                  </div>
                )}
                {hasBodyMatch && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {snippet}
                  </div>
                )}
                {result.item.category && (
                  <div className="text-xs text-muted-foreground mt-1 capitalize">
                    {highlightMatch(result.item.category.replace('-', ' '), result.matches, 'category')}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-1
          bg-white border border-border rounded-lg shadow-lg
          p-4 text-center text-muted-foreground z-50
        ">
          No results found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}
