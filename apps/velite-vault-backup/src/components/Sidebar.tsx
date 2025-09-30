'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { NavigationSection } from '@/lib/content-types'

interface SidebarProps {
  navigation: NavigationSection[]
}

export function Sidebar({ navigation }: SidebarProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    setIsMounted(true)
    // Get pathname after hydration
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname)
    }
  }, [])

  const toggleSection = (sectionSlug: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionSlug)) {
      newCollapsed.delete(sectionSlug)
    } else {
      newCollapsed.add(sectionSlug)
    }
    setCollapsedSections(newCollapsed)
  }

  const isActive = (slug: string) => {
    return currentPath === `/${slug}` || currentPath.startsWith(`/${slug}/`)
  }

  return (
    <nav className="w-64 bg-amber-50 border-r border-amber-200 h-screen overflow-y-auto">
      <div className="p-4">
        <Link href="/" className="block">
          <h1 className="text-xl font-bold text-amber-900 hover:text-amber-700 transition-colors">
            📚 Nimble Vault
          </h1>
        </Link>
      </div>

      <div className="pb-4">
        {navigation.map((section) => {
          const isCollapsed = collapsedSections.has(section.slug)
          const hasContent = section.items.length > 0 || section.subsections.length > 0

          return (
            <div key={section.slug} className="mb-2">
              <button
                onClick={() => toggleSection(section.slug)}
                disabled={!hasContent}
                className={`w-full px-4 py-2 text-left text-sm font-semibold flex items-center justify-between
                  ${hasContent ? 'hover:bg-amber-100 cursor-pointer' : 'cursor-default'}
                  ${isActive(section.slug) ? 'bg-amber-100 text-amber-900' : 'text-amber-800'}
                `}
              >
                <span className="flex items-center gap-2">
                  <span>{section.emoji}</span>
                  <span>{section.name}</span>
                </span>
                {hasContent && (
                  <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                    ▶
                  </span>
                )}
              </button>

              {!isCollapsed && hasContent && (
                <div className="ml-2 border-l border-amber-200">
                  {/* Direct section items */}
                  {section.items.map((item: any) => (
                    <Link
                      key={item.slug}
                      href={`/${item.slug}`}
                      className={`block px-4 py-1 text-sm hover:bg-amber-100 transition-colors
                        ${isActive(item.slug) ? 'bg-amber-100 text-amber-900 font-medium' : 'text-amber-700'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  ))}

                  {/* Subsections */}
                  {section.subsections.map((subsection: any) => (
                    <div key={subsection.slug} className="mt-2">
                      <div className="px-4 py-1 text-xs font-medium text-amber-600 uppercase tracking-wide">
                        {subsection.name}
                      </div>
                      {subsection.items.map((item: any) => (
                        <Link
                          key={item.slug}
                          href={`/${item.slug}`}
                          className={`block px-6 py-1 text-sm hover:bg-amber-100 transition-colors
                            ${isActive(item.slug) ? 'bg-amber-100 text-amber-900 font-medium' : 'text-amber-700'}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-300 rounded-full"></span>
                            <span>{item.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

