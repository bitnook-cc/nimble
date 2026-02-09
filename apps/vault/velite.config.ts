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
    // Public content - accessible to all users (no authentication required)
    public: {
      name: 'PublicContent',
      pattern: ['public/**/*.md', 'public/**/*.mdx'],
      schema: contentSchema
        .transform((data) => {
          const originalSlug = data.slug
          // Remove 'public/' prefix from the slug
          const cleanedSlug = data.slug.replace(/^public\//, '')
          const slugifiedPath = cleanedSlug.split('/').map(slugify).join('/')
          return {
            ...data,
            originalSlug,
            slug: slugifiedPath,
            access: [] as string[], // Public content has no access restrictions (empty array)
            permalink: `/${slugifiedPath}`,
            readingTime: Math.ceil(data.content.split(' ').length / 200),
            searchBody: data.raw.slice(0, 5000), // First 5000 chars for search indexing
          }
        })
    },

    // Patron content - requires patron tier access
    patron: {
      name: 'PatronContent',
      pattern: ['patron/**/*.md', 'patron/**/*.mdx'],
      schema: contentSchema
        .transform((data) => {
          const originalSlug = data.slug
          // Remove 'patron/' prefix from the slug
          const cleanedSlug = data.slug.replace(/^patron\//, '')
          const slugifiedPath = cleanedSlug.split('/').map(slugify).join('/')
          return {
            ...data,
            originalSlug,
            slug: slugifiedPath,
            access: ['patron', 'test'],
            permalink: `/${slugifiedPath}`,
            readingTime: Math.ceil(data.content.split(' ').length / 200),
            searchBody: data.raw.slice(0, 5000), // First 5000 chars for search indexing
          }
        })
    },

    // Purchased content - requires specific purchase tags (e.g., 'core-books')
    purchased: {
      name: 'PurchasedContent',
      pattern: ['purchased/**/*.md', 'purchased/**/*.mdx'],
      schema: contentSchema
        .transform((data) => {
          const originalSlug = data.slug
          // Remove 'purchased/' prefix from the slug
          const cleanedSlug = data.slug.replace(/^purchased\//, '')
          const slugifiedPath = cleanedSlug.split('/').map(slugify).join('/')

          // Extract the product tag from the path (e.g., 'core-books' from 'purchased/core-books/...')
          const productMatch = data.slug.match(/^purchased\/([^\/]+)/)
          const productTag = productMatch ? productMatch[1] : 'purchased'

          return {
            ...data,
            originalSlug,
            slug: slugifiedPath,
            access: [productTag, 'test'],
            permalink: `/${slugifiedPath}`,
            readingTime: Math.ceil(data.content.split(' ').length / 200),
            searchBody: data.raw.slice(0, 5000), // First 5000 chars for search indexing
          }
        })
    }
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

    // Dynamically iterate over all collections
    Object.entries(data).forEach(([collectionName, collection]) => {
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
        const originalItems = collection.map((item: any) => ({
          slug: item.originalSlug || item.slug
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