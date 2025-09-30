'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { docs, patron } from '#site/content'

interface SearchResult {
  title: string
  permalink: string
  category?: string
  description?: string
  access: string[]
}

interface SearchBarProps {
  userTags?: string[]
  onResultSelect?: (result: SearchResult) => void
}

export function SearchBar({ userTags = ['public'], onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combine all content for searching
  const allContent: SearchResult[] = [
    ...docs.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      category: doc.category,
      description: doc.description,
      access: doc.access
    })),
    ...patron.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category,
      description: item.description,
      access: item.access
    }))
  ]

  // Filter content based on user access
  const accessibleContent = allContent.filter(item =>
    item.access.some(access => userTags.includes(access) || access === 'public')
  )

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
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600"
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
            bg-white border border-amber-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
            placeholder-amber-500 text-amber-900
          "
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-800"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-1 
          bg-white border border-amber-300 rounded-lg shadow-lg 
          max-h-96 overflow-y-auto z-50
        ">
          {results.map((result) => (
            <button
              key={result.permalink}
              onClick={() => handleResultClick(result)}
              className="
                w-full text-left p-3 hover:bg-amber-50 
                border-b border-amber-100 last:border-b-0
                focus:outline-none focus:bg-amber-50
              "
            >
              <div className="font-medium text-amber-900">{result.title}</div>
              {result.description && (
                <div className="text-sm text-amber-600 mt-1 line-clamp-2">
                  {result.description}
                </div>
              )}
              {result.category && (
                <div className="text-xs text-amber-500 mt-1 capitalize">
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
          bg-white border border-amber-300 rounded-lg shadow-lg 
          p-4 text-center text-amber-600 z-50
        ">
          No results found for "{query}"
        </div>
      )}
    </div>
  )
}