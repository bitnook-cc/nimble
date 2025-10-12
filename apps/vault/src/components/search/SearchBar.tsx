'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { public as publicContent, patron as patronContent, purchased as purchasedContent } from '#site/content'

interface SearchResult {
  title: string
  permalink: string
  category?: string
  description?: string
  access?: string[]
}

interface SearchBarProps {
  userTags?: string[]
  onResultSelect?: (result: SearchResult) => void
}

export function SearchBar({ userTags = [], onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combine all content for searching
  const allContent: SearchResult[] = [
    ...publicContent.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      category: doc.category,
      description: doc.description,
      access: undefined // Public content has no access restrictions
    })),
    ...patronContent.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category,
      description: item.description,
      access: item.access
    })),
    ...purchasedContent.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category,
      description: item.description,
      access: item.access
    }))
  ]

  // Filter content based on user access
  const accessibleContent = allContent.filter(item => {
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
  })

  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const searchResults = accessibleContent
      .filter(item => {
        const titleMatch = item.title.toLowerCase().includes(query)
        const descriptionMatch = item.description?.toLowerCase().includes(query)
        const categoryMatch = item.category?.toLowerCase().includes(query)
        return titleMatch || descriptionMatch || categoryMatch
      })
      .slice(0, 8) // Limit to 8 results

    setResults(searchResults)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 200) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onResultSelect?.(result)
    
    // Navigate to result
    window.location.href = result.permalink
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
          {results.map((result) => (
            <button
              key={result.permalink}
              onClick={() => handleResultClick(result)}
              className="
                w-full text-left p-3 hover:bg-accent
                border-b border-border last:border-b-0
                focus:outline-none focus:bg-accent
              "
            >
              <div className="font-medium text-foreground">{result.title}</div>
              {result.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {result.description}
                </div>
              )}
              {result.category && (
                <div className="text-xs text-muted-foreground mt-1 capitalize">
                  {result.category.replace('-', ' ')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-1
          bg-white border border-border rounded-lg shadow-lg
          p-4 text-center text-muted-foreground z-50
        ">
          No results found for "{query}"
        </div>
      )}
    </div>
  )
}