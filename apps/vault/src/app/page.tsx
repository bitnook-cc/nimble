import Link from 'next/link'
import { public as publicContent, patron as patronContent, purchased as purchasedContent } from '#site/content'
import type { PublicContent, PatronContent, PurchasedContent } from '#site/content'
import { ContentTreeView } from '@/components/ContentTreeView'
import { publicTree, patronTree, purchasedTree } from '#site/trees'

type AnyContent = PublicContent | PatronContent | PurchasedContent

export default function HomePage() {
  const recentDocs = publicContent.slice(0, 3)
  const featuredContent: AnyContent[] = [...publicContent, ...patronContent, ...purchasedContent].slice(0, 6)

  // Combine all trees
  const combinedTree = [...publicTree, ...patronTree, ...purchasedTree]

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          📚 Welcome to the Vault
        </h1>
        <p className="text-lg text-muted-foreground">
          Your comprehensive digital repository for the Nimble tabletop role-playing game system
        </p>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Additions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentDocs.map((doc: PublicContent) => (
              <Link
                key={doc.slug}
                href={doc.permalink}
                className="
                  bg-white rounded-lg p-6 border border-border shadow-sm
                  hover:shadow-md hover:border-primary transition-all
                "
              >
                <h3 className="font-semibold text-foreground mb-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-muted-foreground text-sm mb-3">{doc.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{doc.category?.replace('-', ' ') || 'General'}</span>
                  <span>{doc.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Start Guide</h2>
          <div className="bg-white rounded-lg p-8 border border-border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">New to Nimble RPG?</h3>
                <p className="text-muted-foreground mb-4">
                  Start your journey with our comprehensive getting started guide.
                </p>
                <Link
                  href="/quickstart/01-introduction"
                  className="
                    inline-block bg-primary text-white px-4 py-2 rounded-md
                    hover:bg-primary/90 transition-colors
                  "
                >
                  Get Started
                </Link>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Ready to Create?</h3>
                <p className="text-muted-foreground mb-4">
                  Jump into character creation and build your first hero.
                </p>
                <Link
                  href="/quickstart/02-combat-and-actions"
                  className="
                    inline-block bg-secondary text-foreground px-4 py-2 rounded-md border border-border
                    hover:bg-accent transition-colors
                  "
                >
                  Create Character
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section>
          <ContentTreeView
            tree={combinedTree}
            title="All Available Documents"
            expandAll={true}
          />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredContent.map((item) => (
              <Link
                key={item.slug}
                href={item.permalink}
                className="
                  bg-white rounded-lg p-4 border border-border shadow-sm
                  hover:shadow-md hover:border-primary transition-all
                  flex flex-col
                "
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground line-clamp-2">{item.title}</h4>
                  {item.access && item.access.includes('patron') && (
                    <span className="text-xs bg-accent text-foreground px-2 py-1 rounded">
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm flex-1 line-clamp-2">
                  {item.description || 'Explore this content'}
                </p>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.category?.replace('-', ' ') || 'General'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}