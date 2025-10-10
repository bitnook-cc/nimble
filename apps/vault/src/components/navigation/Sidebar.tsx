'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, BookOpen, Lock, Folder, FileText } from 'lucide-react'
import { docs, patron } from '#site/content'

interface NavigationItem {
  title: string
  permalink: string
  slug: string
  access: string[]
  order: number
}

interface TreeNode {
  name: string
  path: string
  children: TreeNode[]
  item?: NavigationItem
  isFolder: boolean
}

interface SidebarProps {
  currentPath?: string
  userTags?: string[]
}

export function Sidebar({ currentPath = '', userTags = ['public'] }: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([]))

  // Combine and organize all content
  const allContent: NavigationItem[] = [
    ...docs.map(doc => ({
      title: doc.title,
      permalink: doc.permalink,
      slug: doc.slug,
      access: doc.access,
      order: doc.order
    })),
    ...patron.map(item => ({
      title: item.title,
      permalink: item.permalink,
      slug: item.slug,
      access: item.access,
      order: item.order
    }))
  ]

  // Filter content based on user access
  const accessibleContent = allContent.filter(item =>
    item.access.some(access => userTags.includes(access) || access === 'public')
  )

  // Build tree structure from slugs
  const buildTree = (items: NavigationItem[]): TreeNode[] => {
    const root: Map<string, TreeNode> = new Map()

    items.forEach(item => {
      const parts = item.slug.split('/')
      let currentMap = root
      let currentPath = ''

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isLeaf = index === parts.length - 1

        if (!currentMap.has(part)) {
          const node: TreeNode = {
            name: part,
            path: currentPath,
            children: [],
            isFolder: !isLeaf,
            ...(isLeaf && { item })
          }
          currentMap.set(part, node)
        }

        if (!isLeaf) {
          const node = currentMap.get(part)!
          if (!node.children) node.children = []

          // Convert children array to map for next iteration
          const childMap = new Map<string, TreeNode>()
          node.children.forEach(child => childMap.set(child.name, child))
          currentMap = childMap
        }
      })
    })

    // Convert map to sorted array
    const sortNodes = (nodes: Map<string, TreeNode>): TreeNode[] => {
      return Array.from(nodes.values())
        .map(node => ({
          ...node,
          children: node.children.length > 0 ? sortChildrenRecursively(node.children) : []
        }))
        .sort((a, b) => {
          // Folders first, then files
          if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
          // Then by order if items exist
          if (a.item && b.item) return a.item.order - b.item.order
          // Then alphabetically
          return a.name.localeCompare(b.name)
        })
    }

    const sortChildrenRecursively = (children: TreeNode[]): TreeNode[] => {
      return children
        .map(node => ({
          ...node,
          children: node.children.length > 0 ? sortChildrenRecursively(node.children) : []
        }))
        .sort((a, b) => {
          if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
          if (a.item && b.item) return a.item.order - b.item.order
          return a.name.localeCompare(b.name)
        })
    }

    return sortNodes(root)
  }

  const tree = buildTree(accessibleContent)

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const hasRestrictedAccess = (access: string[]) => {
    return access.some(tag => tag !== 'public')
  }

  const formatName = (name: string) => {
    // Remove file extensions and clean up
    return name
      .replace(/\.(md|mdx)$/, '')
      .replace(/[-_]/g, ' ')
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedPaths.has(node.path)
    const hasChildren = node.children && node.children.length > 0

    if (node.isFolder) {
      return (
        <div key={node.path} className="mb-1">
          <button
            onClick={() => togglePath(node.path)}
            className="w-full flex items-center gap-2 p-2 text-left text-foreground hover:bg-accent rounded-md transition-colors text-sm"
            style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
            <Folder size={14} className="text-muted-foreground" />
            <span className="font-medium">{formatName(node.name)}</span>
            {hasChildren && (
              <span className="text-xs text-muted-foreground ml-auto">
                ({node.children.length})
              </span>
            )}
          </button>

          {isExpanded && hasChildren && (
            <div className="mt-1">
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // Leaf node (actual content item)
    if (node.item) {
      return (
        <div key={node.path}>
          <Link
            href={node.item.permalink}
            className={`
              flex items-center gap-2 p-2 text-sm rounded-md transition-colors
              ${currentPath === node.item.permalink
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-foreground hover:bg-accent'
              }
            `}
            style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
          >
            <FileText size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="flex-1 truncate">{node.item.title}</span>
            {hasRestrictedAccess(node.item.access) && (
              <Lock size={12} className="text-muted-foreground flex-shrink-0" />
            )}
          </Link>
        </div>
      )
    }

    return <></>
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-card to-secondary border-r border-border h-screen overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen size={20} />
          Nimble Vault
        </h2>
        <p className="text-sm text-muted-foreground mt-1">RPG Knowledge Base</p>
      </div>

      <nav className="p-4">
        {tree.length > 0 ? (
          tree.map(node => renderTreeNode(node, 0))
        ) : (
          <div className="text-center text-muted-foreground mt-8">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No accessible content found</p>
            <p className="text-xs mt-2">Check your permissions</p>
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Access Level:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {userTags.map(tag => (
              <span key={tag} className="bg-accent px-2 py-1 rounded text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
