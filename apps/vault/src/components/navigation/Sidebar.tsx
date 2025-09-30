'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, BookOpen, Lock } from 'lucide-react'
import { docs, patron } from '#site/content'

interface NavigationItem {
  title: string
  permalink: string
  category?: string
  access: string[]
  order: number
}

interface CategoryGroup {
  [category: string]: NavigationItem[]
}

interface SidebarProps {
  currentPath?: string
  userTags?: string[]
}

export function Sidebar({ currentPath = '', userTags = ['public'] }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['basics']))

  // Combine and organize all content
  const allContent: NavigationItem[] = [
    ...docs.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      category: doc.category || 'uncategorized',
      access: doc.access,
      order: doc.order
    })),
    ...patron.map(item => ({
      title: item.title,
      permalink: item.permalink,
      category: item.category || 'advanced',
      access: item.access,
      order: item.order
    }))
  ]

  // Filter content based on user access
  const accessibleContent = allContent.filter(item =>
    item.access.some(access => userTags.includes(access) || access === 'public')
  )

  // Group by category and sort
  const groupedContent: CategoryGroup = accessibleContent.reduce((acc, item) => {
    const category = item.category || 'uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as CategoryGroup)

  // Sort items within each category
  Object.keys(groupedContent).forEach(category => {
    groupedContent[category].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  })

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      basics: '📚',
      'character-creation': '👤',
      combat: '⚔️',
      magic: '✨',
      equipment: '🛡️',
      advanced: '🔥',
      uncategorized: '📄'
    }
    return iconMap[category] || '📄'
  }

  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const hasRestrictedAccess = (access: string[]) => {
    return access.some(tag => tag !== 'public')
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-amber-50 to-amber-100 border-r border-amber-200 h-screen overflow-y-auto">
      <div className="p-4 border-b border-amber-200">
        <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          <BookOpen size={20} />
          Nimble Vault
        </h2>
        <p className="text-sm text-amber-700 mt-1">RPG Knowledge Base</p>
      </div>

      <nav className="p-4">
        {Object.entries(groupedContent).map(([category, items]) => (
          <div key={category} className="mb-4">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-2 text-left text-amber-900 hover:bg-amber-200 rounded-md transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <span>{getCategoryIcon(category)}</span>
                {formatCategoryName(category)}
                <span className="text-xs text-amber-600">({items.length})</span>
              </span>
              {expandedCategories.has(category) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {expandedCategories.has(category) && (
              <ul className="ml-4 mt-2 space-y-1">
                {items.map((item) => (
                  <li key={item.permalink}>
                    <Link
                      href={item.permalink}
                      className={`
                        flex items-center gap-2 p-2 text-sm rounded-md transition-colors
                        ${currentPath === item.permalink
                          ? 'bg-amber-300 text-amber-900 font-medium'
                          : 'text-amber-800 hover:bg-amber-200'
                        }
                      `}
                    >
                      <span className="flex-1">{item.title}</span>
                      {hasRestrictedAccess(item.access) && (
                        <Lock size={12} className="text-amber-600" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {Object.keys(groupedContent).length === 0 && (
          <div className="text-center text-amber-600 mt-8">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No accessible content found</p>
            <p className="text-xs mt-2">Check your permissions</p>
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-amber-200">
        <div className="text-xs text-amber-600">
          <p>Access Level:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {userTags.map(tag => (
              <span key={tag} className="bg-amber-200 px-2 py-1 rounded text-amber-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}