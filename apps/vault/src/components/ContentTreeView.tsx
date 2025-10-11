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
}

interface ContentTreeViewProps {
  tree: TreeNode[]
  userTags?: string[]
  title?: string
  expandAll?: boolean
}

export function ContentTreeView({
  tree,
  userTags = ['public'],
  title = 'Content Directory',
  expandAll = false,
}: ContentTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(expandAll ? getAllPaths(tree) : [])
  )

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
    console.log(node.path, depth, node.children)
    
    const isExpanded = expandedPaths.has(node.path)
    const hasChildren = node.children && node.children.length > 0

    if (hasChildren) {
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

          {(
            <div className="mt-1">
              {node.children.map((child) => {console.log("Rendering child...", child); return renderTreeNode(child, depth + 1)})}
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

    return <div key={node.path}>No item found</div>
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
        <span>Total documents: {countLeafNodes(tree)}</span>
      </div>
    </div>
  )
}

// Helper function to count leaf nodes (actual documents)
function countLeafNodes(nodes: TreeNode[]): number {
  let count = 0
  nodes.forEach((node) => {
    if (node.item) {
      count++
    }
    if (node.children && node.children.length > 0) {
      count += countLeafNodes(node.children)
    }
  })
  return count
}

// Helper function to get all folder paths for expand all
function getAllPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = []
  const traverse = (node: TreeNode) => {
    if (node.children && node.children.length > 0) {
      paths.push(node.path)
      node.children.forEach(traverse)
    }
  }
  nodes.forEach(traverse)
  return paths
}
