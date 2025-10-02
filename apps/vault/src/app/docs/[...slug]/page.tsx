import { notFound } from 'next/navigation'
import { docs, type Doc } from '#site/content'
import { MDXContent } from '@/components/mdx-content'

interface DocsPageProps {
  params: Promise<{
    slug: string[]
  }>
}

function getDocFromParams(params: { slug: string[] }): Doc | null {
  const slug = params?.slug?.join('/')
  const doc = docs.find((doc: Doc) => doc.slug === slug)

  if (!doc) {
    return null
  }

  return doc
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return docs.map((doc: Doc) => ({
    slug: doc.slug.split('/'),
  }))
}

export async function generateMetadata({ params }: DocsPageProps) {
  const resolvedParams = await params
  const doc = getDocFromParams(resolvedParams)

  if (!doc) {
    return {}
  }

  return {
    title: doc.title,
    description: doc.description,
  }
}

export default async function DocsPage({ params }: DocsPageProps) {
  const resolvedParams = await params
  const doc = getDocFromParams(resolvedParams)

  if (!doc) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="capitalize">{doc.category?.replace('-', ' ') || 'General'}</span>
          <span>•</span>
          <span>{doc.readingTime} min read</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">{doc.title}</h1>
        {doc.description && (
          <p className="text-xl text-muted-foreground">{doc.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <article className="prose prose-amber max-w-none p-8">
          <MDXContent code={doc.content} />
        </article>
      </div>

      {doc.toc && doc.toc.length > 0 && (
        <aside className="mt-8 bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <nav>
            <ul className="space-y-2">
              {doc.toc.map((item: any, index: number) => (
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