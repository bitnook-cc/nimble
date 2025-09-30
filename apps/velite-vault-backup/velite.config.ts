import { defineConfig, s } from 'velite'

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
      pattern: ['public/**/*.md', 'public/**/*.mdx'],
      schema: s
        .object({
          title: s.string().max(99),
          description: s.string().max(999).optional(),
          category: s.string().optional(),
          order: s.number().default(0),
          tags: s.array(s.string()).default([]),
          access: s.array(s.string()).default(['public']),
          slug: s.path(),
          content: s.mdx(),
          toc: s.toc(),
          metadata: s.metadata(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/docs/${data.slug}`,
          readingTime: Math.ceil(data.content.split(' ').length / 200), // Rough reading time
        }))
    },
    
    // Patron/Premium content - requires authentication
    patron: {
      name: 'PatronContent',
      pattern: ['patron/**/*.md', 'patron/**/*.mdx'],
      schema: s
        .object({
          title: s.string().max(99),
          description: s.string().max(999).optional(),
          category: s.string().optional(),
          order: s.number().default(0),
          tags: s.array(s.string()).default([]),
          access: s.array(s.string()).default(['patron']),
          slug: s.path(),
          content: s.mdx(),
          toc: s.toc(),
          metadata: s.metadata(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/patron/${data.slug}`,
          readingTime: Math.ceil(data.content.split(' ').length / 200),
        }))
    }
  },
  
  // MDX configuration for custom components
  mdx: {
    rehypePlugins: [],
    remarkPlugins: []
  }
})