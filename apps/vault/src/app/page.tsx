import Link from 'next/link'
import { docs, patron, type Doc, type PatronContent } from '#site/content'

export default function HomePage() {
  const recentDocs = docs.slice(0, 3)
  const featuredContent = [...docs, ...patron].slice(0, 6)

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">
          📚 Welcome to the Vault
        </h1>
        <p className="text-lg text-amber-700">
          Your comprehensive digital repository for the Nimble tabletop role-playing game system
        </p>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Recent Additions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentDocs.map((doc: Doc) => (
              <Link
                key={doc.slug}
                href={doc.permalink}
                className="
                  bg-white rounded-lg p-6 border border-amber-200 shadow-sm
                  hover:shadow-md hover:border-amber-300 transition-all
                "
              >
                <h3 className="font-semibold text-amber-900 mb-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-amber-600 text-sm mb-3">{doc.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-amber-500">
                  <span className="capitalize">{doc.category?.replace('-', ' ') || 'General'}</span>
                  <span>{doc.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Quick Start Guide</h2>
          <div className="bg-white rounded-lg p-8 border border-amber-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-amber-900 mb-4">New to Nimble RPG?</h3>
                <p className="text-amber-700 mb-4">
                  Start your journey with our comprehensive getting started guide.
                </p>
                <Link 
                  href="/docs/getting-started"
                  className="
                    inline-block bg-amber-600 text-white px-4 py-2 rounded-md
                    hover:bg-amber-700 transition-colors
                  "
                >
                  Get Started
                </Link>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Ready to Create?</h3>
                <p className="text-amber-700 mb-4">
                  Jump into character creation and build your first hero.
                </p>
                <Link 
                  href="/docs/character-creation"
                  className="
                    inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-md border border-amber-300
                    hover:bg-amber-200 transition-colors
                  "
                >
                  Create Character
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Browse Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredContent.map((item) => (
              <Link
                key={item.slug}
                href={item.permalink}
                className="
                  bg-white rounded-lg p-4 border border-amber-200 shadow-sm
                  hover:shadow-md hover:border-amber-300 transition-all
                  flex flex-col
                "
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-amber-900 line-clamp-2">{item.title}</h4>
                  {item.access.includes('patron') && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-amber-600 text-sm flex-1 line-clamp-2">
                  {item.description || 'Explore this content'}
                </p>
                <div className="mt-3 pt-3 border-t border-amber-100">
                  <span className="text-xs text-amber-500 capitalize">
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