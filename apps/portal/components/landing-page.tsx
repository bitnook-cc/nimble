'use client'

import { useState, useEffect } from 'react'
import {
  Dice6,
  FileText,
  Users,
  Calendar,
  BookOpen,
  Sword,
  Shield,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { LoginDialog } from './login-dialog'

interface ToolCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  status: 'available' | 'coming-soon' | 'placeholder'
  tags?: string[]
}

interface LandingPageProps {
  returnTo?: string
}

const tools: ToolCard[] = [
  {
    id: 'rules-vault',
    title: 'Rules Vault',
    description: 'Browse the complete Nimble RPG rulebook with searchable content and quick reference.',
    icon: <BookOpen className="w-6 h-6" />,
    href: '/vault',
    status: 'available',
    tags: ['reference', 'rules']
  },
  {
    id: 'character-sheets',
    title: 'Character Sheets',
    description: 'Create and manage your Nimble RPG characters with our comprehensive digital character sheet.',
    icon: <FileText className="w-6 h-6" />,
    href: '/characters',
    status: 'coming-soon',
    tags: ['core', 'character-management']
  },
  {
    id: 'dice-roller',
    title: 'Dice Roller',
    description: 'Advanced dice rolling with advantage, exploding dice, and dice pool management.',
    icon: <Dice6 className="w-6 h-6" />,
    href: '/dice',
    status: 'coming-soon',
    tags: ['core', 'dice']
  },
  {
    id: 'monster-builder',
    title: 'Monster Builder',
    description: 'Design custom monsters and NPCs with stat blocks and special abilities.',
    icon: <Sword className="w-6 h-6" />,
    href: '/monsters',
    status: 'placeholder',
    tags: ['gm-tools', 'content-creation']
  },
  {
    id: 'encounter-builder',
    title: 'Encounter Builder',
    description: 'Build and manage combat encounters with initiative tracking and monster management.',
    icon: <Shield className="w-6 h-6" />,
    href: '/encounters',
    status: 'placeholder',
    tags: ['gm-tools', 'combat']
  },
  {
    id: 'campaign-manager',
    title: 'Campaign Manager',
    description: 'Organize your campaigns, track sessions, and manage player groups.',
    icon: <Users className="w-6 h-6" />,
    href: '/campaigns',
    status: 'placeholder',
    tags: ['gm-tools', 'organization']
  },
  {
    id: 'session-planner',
    title: 'Session Planner',
    description: 'Plan your game sessions with notes, maps, and encounter preparation.',
    icon: <Calendar className="w-6 h-6" />,
    href: '/sessions',
    status: 'placeholder',
    tags: ['gm-tools', 'planning']
  }
]

export function LandingPage({ returnTo }: LandingPageProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Auto-open login dialog if returnTo is present
  useEffect(() => {
    if (returnTo) {
      setShowLoginDialog(true)
    }
  }, [returnTo])

  const getStatusBadge = (status: ToolCard['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Sparkles className="w-3 h-3 mr-1" />
            Ready
          </span>
        )
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Coming Soon
          </span>
        )
      case 'placeholder':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Planned
          </span>
        )
    }
  }

  const handleToolClick = (tool: ToolCard) => {
    if (tool.status === 'available') {
      if (tool.id === 'rules-vault') {
        // In development, redirect to vault dev server (port 4321)
        // In production, redirect to /vault path
        const vaultUrl = process.env.NODE_ENV === 'development'
          ? 'http://localhost:4321'
          : '/vault'
        window.location.href = vaultUrl
      } else {
        window.location.href = tool.href
      }
    }
  }

  return (
    <>
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        returnTo={returnTo}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {returnTo && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <strong>Login Required:</strong> You need to sign in to access this content.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Your Gaming Toolkit
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to play and run Nimble RPG campaigns.
          </p>
        </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 transition-all duration-200 ${
              tool.status === 'available'
                ? 'hover:shadow-md hover:border-slate-300 cursor-pointer'
                : 'opacity-75'
            }`}
            onClick={() => handleToolClick(tool)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-slate-100">
                  {tool.icon}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {tool.title}
                  </h3>
                </div>
              </div>
              {getStatusBadge(tool.status)}
            </div>

            <p className="text-slate-600 mb-4">
              {tool.description}
            </p>

            {tool.tags && (
              <div className="flex flex-wrap gap-1 mb-4">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {tool.status === 'available' && (
              <div className="flex items-center text-sm text-blue-600 font-medium">
                Open Tool
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
    </>
  )
}
