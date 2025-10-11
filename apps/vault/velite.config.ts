import { defineConfig, s } from 'velite'
import { writeFileSync } from 'fs'
import { join } from 'path'

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
    toc: s.toc(),
    metadata: s.metadata(),
  })

// Tree node structure
interface TreeNode {
  name: string
  path: string
  children: TreeNode[]
  item?: {
    title: string
    permalink: string
    slug: string
    access: string[]
  }
}

// Build tree structure from content items
function buildTree(items: Array<{ title: string; permalink: string; slug: string; access: string[] }>): TreeNode[] {
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
      let childNode = currentNode.children.find((child) => child.name === part)

      if (!childNode) {
        childNode = {
          name: part,
          path: currentPath,
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
    // Public content - accessible to all users
    docs: {
      name: 'Doc',
      pattern: [
        'public/**/*.md',
        'public/**/*.mdx'
      ],
      schema: contentSchema
        .transform((data) => ({
          ...data,
          access: data.access.length > 0 ? data.access : ['public'],
          permalink: `/docs/${data.slug}`,
          readingTime: Math.ceil(data.content.split(' ').length / 200), // Rough reading time
        }))
    },

    // Patron/Premium content - requires authentication (from private submodule)
    patron: {
      name: 'PatronContent',
      pattern: ['premium/**/*.md', 'premium/**/*.mdx'],
      schema: contentSchema
        .transform((data) => ({
          ...data,
          access: data.access.length > 0 ? data.access : ['test'],
          permalink: `/${data.slug}`,
          readingTime: Math.ceil(data.content.split(' ').length / 200),
        }))
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

    // Build tree for docs collection
    const docsItems = data.docs.map((doc: any) => ({
      title: doc.title,
      permalink: doc.permalink,
      slug: doc.slug,
      access: doc.access,
    }))
    const docsTree = buildTree(docsItems)

    // Build tree for patron collection
    const patronItems = data.patron.map((item: any) => ({
      title: item.title,
      permalink: item.permalink,
      slug: item.slug,
      access: item.access,
    }))
    const patronTree = buildTree(patronItems)

    // Write trees to separate files
    const outputDir = join(process.cwd(), '.velite')

    writeFileSync(
      join(outputDir, 'docs-tree.json'),
      JSON.stringify(docsTree, null, 2),
      'utf-8'
    )

    writeFileSync(
      join(outputDir, 'patron-tree.json'),
      JSON.stringify(patronTree, null, 2),
      'utf-8'
    )

    console.log(`[VELITE] ✅ Built docs tree: ${docsItems.length} items`)
    console.log(`[VELITE] ✅ Built patron tree: ${patronItems.length} items`)
  }
})