import { defineConfig, s } from 'velite'
import { getContentSchema } from './external/vault-content/velite-schema.js'

// Shared content schema for both public and premium content
// Schema definition is maintained in the vault-content repository
const contentSchema = getContentSchema(s)

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
        .transform((data: any) => ({
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
        .transform((data: any) => ({
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
  }
})