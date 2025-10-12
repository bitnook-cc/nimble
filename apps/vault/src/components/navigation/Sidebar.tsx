'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, BookOpen, Lock, Folder, FileText } from 'lucide-react'
import { publicTree, patronTree, purchasedTree, type TreeNode } from '#site/trees'

interface SidebarProps {
  currentPath?: string
  userTags?: string[]
}

export function Sidebar({ currentPath = '', userTags = [] }: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([]))

  // Combine all trees and filter by user access
  const allTreesArray = [publicTree, patronTree, purchasedTree].flat()
  const combinedTree = allTreesArray.filter((node) =>
    filterTreeByAccess(node, userTags)
  )

  // Recursively filter tree nodes by access
  function filterTreeByAccess(node: TreeNode, tags: string[]): boolean {
    // If user has 'test' tag, they can see everything
    if (tags.includes('test')) {
      return true
    }

    // If it's a leaf node with an item, check access
    if (node.item) {
      // Public content has no access array, so it's always visible
      if (!node.item.access || node.item.access.length === 0) {
        return true
      }
      // Check if user has any of the required access tags
      return node.item.access.some(access => tags.includes(access))
    }

    // If it's a folder, recursively filter children
    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children.filter(child => filterTreeByAccess(child, tags))
      // Keep folder if it has any accessible children
      return filteredChildren.length > 0
    }

    return false
  }

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const hasRestrictedAccess = (access?: string[]) => {
    // No access array means public content
    if (!access || access.length === 0) {
      return false
    }
    // Content with access array is restricted
    return true
  }

  const formatName = (name: string) => {
    // Remove file extensions and clean up
    return name
      .replace(/\.(md|mdx)$/, '')
      .replace(/[-_]/g, ' ')
  }

  const getDisplayName = (node: TreeNode) => {
    return node.displayName || formatName(node.name)
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedPaths.has(node.path)
    const hasChildren = node.children && node.children.length > 0

    // Folder node
    if (hasChildren) {
      return (
        <div key={node.path} className="mb-1">
          <button
            onClick={() => togglePath(node.path)}
            className="w-full flex items-center gap-2 p-2 text-left text-foreground hover:bg-accent rounded-md transition-colors text-sm"
            style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-muted-foreground" />
            <span className="font-medium">{getDisplayName(node)}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              ({node.children.length})
            </span>
          </button>

          {isExpanded && (
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
        {combinedTree.length > 0 ? (
          combinedTree.map(node => renderTreeNode(node, 0))
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
