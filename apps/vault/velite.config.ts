import { defineConfig, s } from 'velite'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Normalize strings for URL-safe paths
function slugify(str: string): string {
  return str
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Shared content schema for both public and premium content
// Schema definition is maintained in the vault-content repository
const contentSchema = s.object({
    title: s.string().max(99),
    description: s.string().max(999).optional(),
    category: s.string().optional(),
    order: s.number().default(0),
    tags: s.array(s.string()).default([]),
    access: s.array(s.string()).default([]),
    slug: s.path(),
    content: s.mdx(),
    raw: s.markdown(), // Raw markdown content for search indexing
    toc: s.toc(),
    metadata: s.metadata(),
  })

/**
 * Utility function to create 3 separate bundles for a content collection:
 * 1. Meta - Lightweight metadata for navigation (title, category, permalink, access)
 * 2. Search - Optimized for search indexing (includes 10k chars of content)
 * 3. Content - Full content for page rendering (MDX, TOC, everything)
 */
function createContentCollections(
  name: string,
  pattern: string[],
  options: {
    pathPrefix: string // Prefix to remove from slug (e.g., 'public/', 'patron/')
    accessTransform: (data: any) => string[] // Function to determine access tags
  }
) {
  const baseTransform = (data: any) => {
    const originalSlug = data.slug
    const cleanedSlug = data.slug.replace(new RegExp(`^${options.pathPrefix}`), '')
    const slugifiedPath = cleanedSlug.split('/').map(slugify).join('/')
    return {
      originalSlug,
      cleanedSlug,
      slugifiedPath,
      access: options.accessTransform(data),
    }
  }

  return {
    // 1. METADATA - For navigation trees and minimal UI (smallest bundle)
    [`${name}Meta`]: {
      name: `${name}Meta`,
      pattern,
      schema: contentSchema.transform((data) => {
        const base = baseTransform(data)
        return {
          title: data.title,
          category: data.category,
          slug: base.slugifiedPath,
          permalink: `/${base.slugifiedPath}`,
          access: base.access.length > 0 ? base.access : undefined,
        }
      })
    },

    // 2. SEARCH - For fuzzy search indexing (medium bundle)
    [`${name}Search`]: {
      name: `${name}Search`,
      pattern,
      schema: contentSchema.transform((data) => {
        const base = baseTransform(data)
        return {
          title: data.title,
          description: data.description,
          category: data.category,
          slug: base.slugifiedPath,
          permalink: `/${base.slugifiedPath}`,
          access: base.access.length > 0 ? base.access : undefined,
          searchBody: data.raw.slice(0, 10000), // First 10k chars for search
          readingTime: Math.ceil(data.raw.split(' ').length / 200),
        }
      })
    },

    // 3. CONTENT - For full page rendering (largest bundle, lazy loaded)
    [`${name}Content`]: {
      name: `${name}Content`,
      pattern,
      schema: contentSchema.transform((data) => {
        const base = baseTransform(data)
        return {
          ...data,
          originalSlug: base.originalSlug,
          slug: base.slugifiedPath,
          access: base.access.length > 0 ? base.access : undefined,
          permalink: `/${base.slugifiedPath}`,
          readingTime: Math.ceil(data.raw.split(' ').length / 200),
        }
      })
    }
  }
}

// Tree node structure
interface TreeNode {
  name: string // Slugified name for URLs
  displayName?: string // Original name for display
  path: string
  children: TreeNode[]
  item?: {
    title: string
    permalink: string
    slug: string
    access?: string[]
  }
}

// Build tree structure from content items with original slugs for display name reconstruction
function buildTree(items: Array<{ title: string; permalink: string; slug: string; access?: string[] }>, originalItems?: Array<{ slug: string }>): TreeNode[] {
  // Create a map of slugified path to original path parts
  const pathMap = new Map<string, string>()
  if (originalItems) {
    originalItems.forEach((origItem) => {
      const origParts = origItem.slug.split('/')
      const slugParts = origParts.map(slugify)
      origParts.forEach((origPart, idx) => {
        const slugPath = slugParts.slice(0, idx + 1).join('/')
        pathMap.set(slugPath, origPart)
      })
    })
  }

  const root: TreeNode = {
    name: '',
    path: '',
    children: [],
  }

  items.forEach((item) => {
    const parts = item.slug.split('/')
    let currentNode = root
    let currentPath = ''

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLeaf = index === parts.length - 1

      // Find or create child node
      let childNode = currentNode.children.find((child) => child.path === currentPath)

      if (!childNode) {
        const displayName = pathMap.get(currentPath) || part
        childNode = {
          name: part, // Slugified name
          displayName: displayName, // Original name for display
          path: currentPath, // Already slugified in transform
          children: [],
          ...(isLeaf && { item }),
        }
        currentNode.children.push(childNode)
      }

      // Move to the child node for next iteration
      if (!isLeaf) {
        currentNode = childNode
      }
    })
  })

  // Sort children recursively
  const sortChildrenRecursively = (node: TreeNode): TreeNode => {
    const sortedChildren = node.children
      .map((child) => sortChildrenRecursively(child))
      .sort((a, b) => {
        // Folders first, then files
        if (a.children.length !== b.children.length) return b.children.length - a.children.length
        // Then alphabetically
        return a.name.localeCompare(b.name)
      })

    return {
      ...node,
      children: sortedChildren,
    }
  }

  const sortedRoot = sortChildrenRecursively(root)
  return sortedRoot.children
}

export default defineConfig({
  root: './content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true
  },
  collections: {
    // Generate 3 bundles for each content type using utility function

    // PUBLIC content - accessible to all users (no authentication required)
    ...createContentCollections('public', ['public/**/*.md', 'public/**/*.mdx'], {
      pathPrefix: 'public/',
      accessTransform: () => [] // Public content has no access restrictions
    }),

    // PATRON content - requires patron tier access
    ...createContentCollections('patron', ['patron/**/*.md', 'patron/**/*.mdx'], {
      pathPrefix: 'patron/',
      accessTransform: () => ['patron', 'test']
    }),

    // PURCHASED content - requires specific purchase tags (e.g., 'core-books')
    ...createContentCollections('purchased', ['purchased/**/*.md', 'purchased/**/*.mdx'], {
      pathPrefix: 'purchased/',
      accessTransform: (data) => {
        // Extract the product tag from the path (e.g., 'core-books' from 'purchased/core-books/...')
        const productMatch = data.slug.match(/^purchased\/([^\/]+)/)
        const productTag = productMatch ? productMatch[1] : 'purchased'
        return [productTag, 'test']
      }
    })
  },
  
  // MDX configuration for custom components
  mdx: {
    rehypePlugins: [],
    remarkPlugins: []
  },

  // Build navigation trees after all collections are processed
  complete: (data) => {
    console.log('[VELITE] Building navigation trees...')
    const outputDir = join(process.cwd(), '.velite')

    const collectionNames: string[] = []

    // Only build trees for metadata collections (lightweight)
    const metaCollections = ['publicMeta', 'patronMeta', 'purchasedMeta']

    // Dynamically iterate over metadata collections
    Object.entries(data).forEach(([collectionName, collection]) => {
      // Only process metadata collections for tree building
      if (!metaCollections.includes(collectionName)) {
        return
      }

      if (Array.isArray(collection) && collection.length > 0) {
        const items = collection.map((item: any) => {
          const baseItem = {
            title: item.title,
            permalink: item.permalink,
            slug: item.slug,
          }
          // Only include access if it exists
          return item.access ? { ...baseItem, access: item.access } : baseItem
        })

        // For originalSlug, we need to look up from the corresponding Content collection
        // Since Meta doesn't have originalSlug, we'll use the slug directly
        const originalItems = collection.map((item: any) => ({
          slug: item.slug
        }))
        const tree = buildTree(items, originalItems)

        writeFileSync(
          join(outputDir, `${collectionName}-tree.json`),
          JSON.stringify(tree, null, 2),
          'utf-8'
        )

        collectionNames.push(collectionName)
        console.log(`[VELITE] ✅ Built ${collectionName} tree: ${items.length} items`)
      }
    })

    // Generate trees.js export file
    const treesExports = collectionNames.map(name =>
      `export { default as ${name}Tree } from './${name}-tree.json'`
    ).join('\n')

    const allTreesImports = collectionNames.map(name =>
      `import ${name}TreeData from './${name}-tree.json'`
    ).join('\n')

    const allTreesExport = `\nexport const allTrees = {\n${collectionNames.map(name =>
      `  ${name}: ${name}TreeData`
    ).join(',\n')}\n}`

    writeFileSync(
      join(outputDir, 'trees.js'),
      `// This file is generated by Velite\n\n${allTreesImports}\n\n${treesExports}${allTreesExport}\n`,
      'utf-8'
    )

    // Generate trees.d.ts type definitions
    const treeType = `export interface TreeNode {
  name: string
  displayName?: string
  path: string
  children: TreeNode[]
  item?: {
    title: string
    permalink: string
    slug: string
    access?: string[]
  }
}`

    const treeExports = collectionNames.map(name =>
      `export declare const ${name}Tree: TreeNode[]`
    ).join('\n')

    const allTreesType = `\nexport declare const allTrees: {\n${collectionNames.map(name =>
      `  ${name}: TreeNode[]`
    ).join('\n')}\n}`

    writeFileSync(
      join(outputDir, 'trees.d.ts'),
      `// This file is generated by Velite\n\n${treeType}\n\n${treeExports}${allTreesType}\n`,
      'utf-8'
    )

    console.log('[VELITE] ✅ Generated trees.js and trees.d.ts')
  }
})