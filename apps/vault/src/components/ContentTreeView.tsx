'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Folder, FileText, Lock } from 'lucide-react'

interface ContentItem {
  title: string
  permalink: string
  slug: string
  access: string[]
}

interface TreeNode {
  name: string
  path: string
  children: TreeNode[]
  item?: ContentItem
  isFolder: boolean
}

interface ContentTreeViewProps {
  items: ContentItem[]
  userTags?: string[]
  title?: string
  expandAll?: boolean
}

export function ContentTreeView({
  items,
  userTags = ['public'],
  title = 'Content Directory',
  expandAll = false,
}: ContentTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(expandAll ? getAllPaths(items) : [])
  )

  // Build tree structure from slugs
  const buildTree = (contentItems: ContentItem[]): TreeNode[] => {
    const root: Map<string, TreeNode> = new Map()

    contentItems.forEach((item) => {
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
            ...(isLeaf && { item }),
          }
          currentMap.set(part, node)
        }

        if (!isLeaf) {
          const node = currentMap.get(part)!
          if (!node.children) node.children = []

          // Convert children array to map for next iteration
          const childMap = new Map<string, TreeNode>()
          node.children.forEach((child) => childMap.set(child.name, child))
          currentMap = childMap
        }
      })
    })

    // Convert map to sorted array
    const sortNodes = (nodes: Map<string, TreeNode>): TreeNode[] => {
      return Array.from(nodes.values())
        .map((node) => ({
          ...node,
          children: node.children.length > 0 ? sortChildrenRecursively(node.children) : [],
        }))
        .sort((a, b) => {
          if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
          return a.name.localeCompare(b.name)
        })
    }

    const sortChildrenRecursively = (children: TreeNode[]): TreeNode[] => {
      return children
        .map((node) => ({
          ...node,
          children: node.children.length > 0 ? sortChildrenRecursively(node.children) : [],
        }))
        .sort((a, b) => {
          if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
          return a.name.localeCompare(b.name)
        })
    }

    return sortNodes(root)
  }

  const tree = buildTree(items)

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
    return access.some((tag) => tag !== 'public')
  }

  const formatName = (name: string) => {
    return name.replace(/\.(md|mdx)$/, '').replace(/[-_]/g, ' ')
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedPaths.has(node.path)
    const hasChildren = node.children && node.children.length > 0

    if (node.isFolder) {
      return (
        <div key={node.path} className="mb-1">
          <button
            onClick={() => togglePath(node.path)}
            className="w-full flex items-center gap-2 p-2 text-left hover:bg-accent/50 rounded-md transition-colors text-sm"
            style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
          >
            {hasChildren &&
              (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
            <Folder size={16} className="text-primary" />
            <span className="font-medium text-foreground">{formatName(node.name)}</span>
            {hasChildren && (
              <span className="text-xs text-muted-foreground ml-auto">
                ({node.children.length})
              </span>
            )}
          </button>

          {isExpanded && hasChildren && (
            <div className="mt-1">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
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
            className="flex items-center gap-2 p-2 text-sm rounded-md transition-colors hover:bg-accent/50 group"
            style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
          >
            <FileText size={16} className="text-muted-foreground flex-shrink-0" />
            <span className="flex-1 truncate text-foreground group-hover:text-primary">
              {node.item.title}
            </span>
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
    <div className="bg-white rounded-lg border border-border shadow-sm p-6">
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <div className="max-h-96 overflow-y-auto border border-border rounded-md p-4 bg-card/30">
        {tree.length > 0 ? (
          tree.map((node) => renderTreeNode(node, 0))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No content available</p>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        <span>Total documents: {items.length}</span>
      </div>
    </div>
  )
}

// Helper function to get all paths for expand all
function getAllPaths(items: ContentItem[]): string[] {
  const paths = new Set<string>()
  items.forEach((item) => {
    const parts = item.slug.split('/')
    let currentPath = ''
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      if (index < parts.length - 1) {
        // Only add folder paths
        paths.add(currentPath)
      }
    })
  })
  return Array.from(paths)
}
