import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'
import { getContentBySlug, getAllContent } from '@/lib/content'
import type { ContentItem } from '@/lib/content-types'

// Import MDX components
import { StatBlock } from '@/components/mdx/StatBlock'
import { ClassFeature } from '@/components/mdx/ClassFeature'
import { LocationCard } from '@/components/mdx/LocationCard'
import { WorldMap } from '@/components/mdx/WorldMap'
import { MonsterStat } from '@/components/mdx/MonsterStat'
import { AbilityBlock } from '@/components/mdx/AbilityBlock'

const components = {
  StatBlock,
  ClassFeature,
  LocationCard,
  WorldMap,
  MonsterStat,
  AbilityBlock,
}

interface PageProps {
  params: Promise<{
    slug: string[]
  }>
}

export default async function ContentPage({ params }: PageProps) {
  const { slug: slugArray } = await params
  const slug = slugArray.join('/')
  const contentItem = getContentBySlug(slug)

  if (!contentItem) {
    notFound()
  }

  // Read and parse the MDX file
  const fileContent = fs.readFileSync(contentItem.fullPath, 'utf-8')
  const { content, data: frontmatter } = matter(fileContent)

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
          <span>{contentItem.section}</span>
          {contentItem.subsection && (
            <>
              <span>›</span>
              <span>{contentItem.subsection}</span>
            </>
          )}
        </div>
        {frontmatter.description && (
          <p className="text-amber-700 text-lg mb-4">{frontmatter.description}</p>
        )}
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {frontmatter.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <article className="prose prose-amber max-w-none">
        <MDXRemote source={content} components={components} />
      </article>
    </div>
  )
}

// Generate static paths for all content
export async function generateStaticParams() {
  const allContent = getAllContent()
  const paths: { slug: string[] }[] = []

  for (const section of allContent) {
    // Add section items
    for (const item of section.items) {
      paths.push({ slug: item.slug.split('/') })
    }

    // Add subsection items
    for (const subsection of section.subsections) {
      for (const item of subsection.items) {
        paths.push({ slug: item.slug.split('/') })
      }
    }
  }

  return paths
}

// Generate metadata for each page
export async function generateMetadata({ params }: PageProps) {
  const { slug: slugArray } = await params
  const slug = slugArray.join('/')
  const contentItem = getContentBySlug(slug)

  if (!contentItem) {
    return {
      title: 'Page Not Found',
    }
  }

  const fileContent = fs.readFileSync(contentItem.fullPath, 'utf-8')
  const { data: frontmatter } = matter(fileContent)

  return {
    title: `${contentItem.title} | Nimble RPG Vault`,
    description: frontmatter.description || contentItem.description,
  }
}