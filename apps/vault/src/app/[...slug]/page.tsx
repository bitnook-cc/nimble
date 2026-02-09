import { notFound, redirect } from 'next/navigation'
import { publicContent, patronContent, purchasedContent } from '#site/content'
import type { FullContent } from '@/types/content'
import { MDXContent } from '@/components/mdx-content'
import { isContentAccessible } from '@/lib/content-access'
import { getPortalUrl } from '@/lib/portal-url'

interface ContentPageProps {
  params: Promise<{
    slug: string[]
  }>
}

function getContentFromParams(params: { slug: string[] }): FullContent | null {
  const slug = params?.slug?.join('/')

  // Search in all collections
  const allContent: FullContent[] = [
    ...publicContent as FullContent[],
    ...patronContent as FullContent[],
    ...purchasedContent as FullContent[]
  ]

  const content = allContent.find((item) => item.slug === slug)

  if (!content) {
    return null
  }

  return content
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allContent: FullContent[] = [
    ...publicContent as FullContent[],
    ...patronContent as FullContent[],
    ...purchasedContent as FullContent[]
  ]

  return allContent.map((item) => ({
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

  // Check if user has access to this content
  const hasAccess = await isContentAccessible(content.access)

  if (!hasAccess) {
    // Redirect to portal login with return URL
    const portalUrl = getPortalUrl()
    const returnUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4321'}/${content.slug}`)
    redirect(`${portalUrl}?returnTo=${returnUrl}`)
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
        <aside className="mt-8 bg-card rounded-lg p-6 border border-border sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <nav className="overflow-y-auto">
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