import { notFound } from 'next/navigation'
import { patron, type PatronContent } from '#site/content'
import { MDXContent } from '@/components/mdx-content'
import { Lock } from 'lucide-react'

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

  // TODO: In a real app, check user authentication and subscription status here
  const hasAccess = true // For demo purposes

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center">
          <Lock size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Premium Content</h1>
          <p className="text-muted-foreground mb-6">
            This content is available to patrons and premium subscribers only.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Become a Patron
            </button>
            <button className="bg-secondary text-foreground px-6 py-2 rounded-md border border-border hover:bg-accent transition-colors">
              Learn More
            </button>
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