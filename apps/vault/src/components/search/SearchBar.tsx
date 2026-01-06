'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, FileText, Lock, Loader2 } from 'lucide-react'
import { searchService, type SearchResult } from '@/lib/search-service'

interface SearchBarProps {
  userTags?: string[]
  onResultSelect?: (result: SearchResult) => void
}

export function SearchBar({ userTags = [], onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Perform search using Fuse.js service
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Use quickSearch for the dropdown
    const searchResults = searchService.quickSearch(searchQuery, userTags, 8)

    setResults(searchResults)
    setIsLoading(false)
  }, [userTags])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 200) // Debounce delay

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    onResultSelect?.(result)

    // Navigate to result
    window.location.href = result.permalink
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleResultClick(results[selectedIndex])
    }
  }

  // Highlight matched text
  const highlightMatch = (text: string, matches?: any[]) => {
    if (!matches || !text) return text

    // Find matches for this specific field
    const fieldMatches = matches.filter(m =>
      m.value && text.toLowerCase().includes(m.value.toLowerCase())
    )

    if (fieldMatches.length === 0) return text

    // Sort matches by index to process them in order
    let highlightedText = text
    let offset = 0

    fieldMatches.forEach(match => {
      if (match.indices) {
        match.indices.forEach(([start, end]: [number, number]) => {
          const before = highlightedText.substring(0, start + offset)
          const matched = highlightedText.substring(start + offset, end + offset + 1)
          const after = highlightedText.substring(end + offset + 1)

          const highlighted = `<mark class="bg-yellow-200 text-inherit">${matched}</mark>`
          highlightedText = before + highlighted + after
          offset += highlighted.length - matched.length
        })
      }
    })

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  const formatScore = (score?: number) => {
    if (!score) return null
    // Convert score to percentage match (inverse of Fuse score)
    const matchPercent = Math.round((1 - score) * 100)
    return matchPercent
  }

  const hasRestrictedAccess = (access?: string[]) => {
    return access && access.length > 0
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
          placeholder="Search vault... (fuzzy search enabled)"
          className="
            w-full pl-10 pr-10 py-2
            bg-white border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder-muted-foreground text-foreground
          "
          aria-label="Search vault content"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-results"
        />
        {isLoading && (
          <Loader2
            size={18}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin"
          />
        )}
        {!isLoading && query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          className="
            absolute top-full left-0 right-0 mt-1
            bg-white border border-border rounded-lg shadow-lg
            max-h-96 overflow-y-auto z-50
          "
          role="listbox"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full text-left p-3 hover:bg-accent
                border-b border-border last:border-b-0
                focus:outline-none focus:bg-accent
                ${selectedIndex === index ? 'bg-accent' : ''}
              `}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {highlightMatch(result.title, result.matches)}
                    </span>
                    {hasRestrictedAccess(result.access) && (
                      <Lock size={12} className="text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  {result.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2 pl-6">
                      {highlightMatch(result.description, result.matches)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 pl-6">
                    {result.category && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {result.category.replace(/-/g, ' ')}
                      </span>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <div className="flex gap-1">
                          {result.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {result.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{result.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {result.score !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {formatScore(result.score)}%
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && !isLoading && (
        <div className="
          absolute top-full left-0 right-0 mt-1
          bg-white border border-border rounded-lg shadow-lg
          p-4 text-center text-muted-foreground z-50
        ">
          No results found for &quot;{query}&quot;
          <div className="text-xs mt-1">
            Try different keywords or check your spelling
          </div>
        </div>
      )}
    </div>
  )
}