'use client'

import { User } from '@supabase/supabase-js'
import {
  Dice6,
  FileText,
  Users,
  Calendar,
  BookOpen,
  ChevronRight,
  Sparkles,
  Sword,
  Shield
} from 'lucide-react'
import { BannerBox } from './banner-box'

interface ToolCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  status: 'available' | 'coming-soon' | 'placeholder'
  tags?: string[]
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

export function PortalHome({ user }: { user: User }) {
  const userTags = (user.app_metadata?.tags || []) as string[]

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
    <div>
      {/* Main Content */}
      <main className="max-w-[120rem] mx-auto px-12 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
            Your Gaming Toolkit
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to play and run Nimble RPG campaigns.
          </p>
        </div>

        {/* Tools Grid wrapped in BannerBox */}
        <BannerBox className="mx-auto">
          <div className="px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`bg-card rounded-nimble-card shadow-sm border border-border p-6 transition-all duration-200 ${
                    tool.status === 'available'
                      ? 'hover:shadow-md hover:border-primary/50 cursor-pointer'
                      : 'opacity-75'
                  }`}
                  onClick={() => handleToolClick(tool)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-secondary">
                        {tool.icon}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-heading font-semibold text-card-foreground">
                          {tool.title}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(tool.status)}
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {tool.description}
                  </p>

                  {tool.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {tool.status === 'available' && (
                    <div className="flex items-center text-sm text-primary font-medium">
                      Open Tool
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </BannerBox>

        {/* User Info Section */}
        <div className="mt-12 bg-card rounded-nimble-card shadow-sm border border-border p-6">
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4">Account Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-foreground">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="text-foreground font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Type:</span>
              <span className="text-foreground">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User Tags:</span>
              <div className="flex flex-wrap gap-1">
                {userTags.length > 0 ? (
                  userTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}