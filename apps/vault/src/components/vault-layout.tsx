'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { SearchBar } from '@/components/search/SearchBar'
import { TopNav } from '@/components/top-nav'

interface VaultLayoutProps {
  children: React.ReactNode
  userTags: string[]
}

export function VaultLayout({ children, userTags }: VaultLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <TopNav onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:static inset-y-0 left-0 z-50
            w-64 transform transition-transform duration-300 md:transform-none
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <Sidebar userTags={userTags} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-border p-4 flex items-center justify-between">
            <SearchBar userTags={userTags} />
          </div>
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-card to-secondary">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
