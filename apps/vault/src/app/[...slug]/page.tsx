import { notFound } from 'next/navigation'
import { public as publicContent, patron as patronContent, purchased as purchasedContent } from '#site/content'
import type { PublicContent, PatronContent, PurchasedContent } from '#site/content'
import { MDXContent } from '@/components/mdx-content'

interface ContentPageProps {
  params: Promise<{
    slug: string[]
  }>
}

type AnyContent = PublicContent | PatronContent | PurchasedContent

function getContentFromParams(params: { slug: string[] }): AnyContent | null {
  const slug = params?.slug?.join('/')

  // Search in all collections
  const allContent = [
    ...publicContent,
    ...patronContent,
    ...purchasedContent
  ]

  const content = allContent.find((item: AnyContent) => item.slug === slug)

  if (!content) {
    return null
  }

  return content
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allContent = [
    ...publicContent,
    ...patronContent,
    ...purchasedContent
  ]

  return allContent.map((item: AnyContent) => ({
    slug: item.slug.split('/'),
  }))
}

export async function generateMetadata({ params }: ContentPageProps) {
  const resolvedParams = await params
  const content = getContentFromParams(resolvedParams)

  if (!content) {
    return {}
  }

  return {
    title: content.title,
    description: content.description,
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const resolvedParams = await params
  const content = getContentFromParams(resolvedParams)

  if (!content) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="capitalize">{content.category?.replace('-', ' ') || 'General'}</span>
          <span>•</span>
          <span>{content.readingTime} min read</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">{content.title}</h1>
        {content.description && (
          <p className="text-xl text-muted-foreground">{content.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <article className="prose prose-amber max-w-none p-8">
          <MDXContent code={content.content} />
        </article>
      </div>

      {content.toc && content.toc.length > 0 && (
        <aside className="mt-8 bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <nav>
            <ul className="space-y-2">
              {content.toc.map((item: any, index: number) => (
                <li key={index} style={{ marginLeft: `${(item.depth - 1) * 1}rem` }}>
                  <a
                    href={`#${item.url.slice(1)}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
  )
}