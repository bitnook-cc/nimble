import { notFound } from 'next/navigation'
import { patron, type PatronContent } from '#site/content'
import { MDXContent } from '@/components/mdx-content'
import { Lock } from 'lucide-react'
import { hasPremiumAccess } from '@/lib/access'
import { getPortalUrl } from '@/lib/portal-url'

interface TocEntry {
  title: string
  url: string
  items: TocEntry[]
}

function TocItem({ item, depth = 0 }: { item: TocEntry; depth?: number }) {
  return (
    <>
      <li style={{ marginLeft: `${depth * 1}rem` }}>
        <a
          href={`#${item.url.slice(1)}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.title}
        </a>
      </li>
      {item.items && item.items.map((subItem, index) => (
        <TocItem key={index} item={subItem} depth={depth + 1} />
      ))}
    </>
  )
}

interface PatronPageProps {
  params: Promise<{
    slug: string[]
  }>
}

async function getPatronContentFromParams(params: { slug: string[] }) {
  const slug = params?.slug?.join('/')
  const content = patron.find((item) => item.slug === slug)

  if (!content) {
    return null
  }

  return content
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return patron.map((item) => ({
    slug: item.slug.split('/'),
  }))
}

export async function generateMetadata({ params }: PatronPageProps) {
  const resolvedParams = await params
  const content = await getPatronContentFromParams(resolvedParams)

  if (!content) {
    return {}
  }

  return {
    title: content.title,
    description: content.description,
  }
}

export default async function PatronPage({ params }: PatronPageProps) {
  const resolvedParams = await params
  const content = await getPatronContentFromParams(resolvedParams)

  if (!content) {
    notFound()
  }

  // Check if user has premium access
  const hasAccess = await hasPremiumAccess()

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
          <Lock size={64} className="mx-auto mb-6 text-amber-600" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Premium Content</h1>
          <p className="text-muted-foreground text-lg mb-2">
            This content is available to premium members only.
          </p>
          <p className="text-muted-foreground mb-8">
            Sign in to access advanced rules, exclusive content, and more.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href={getPortalUrl()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              Sign In to Access
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Lock size={14} />
          <span className="capitalize">{content.category?.replace('-', ' ') || 'Premium'}</span>
          <span>•</span>
          <span>{content.readingTime} min read</span>
          <span className="bg-accent text-foreground px-2 py-1 rounded text-xs">
            Premium
          </span>
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
              {content.toc.map((item, index) => (
                <TocItem key={index} item={item} depth={0} />
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
  )
}