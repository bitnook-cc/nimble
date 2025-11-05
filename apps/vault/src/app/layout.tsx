import type { Metadata } from 'next'
import './globals.css'
import { SidebarWrapper } from '@/components/navigation/SidebarWrapper'
import { SearchBar } from '@/components/search/SearchBar'
import { TopNav } from '@/components/top-nav'

export const metadata: Metadata = {
  title: 'Nimble RPG Vault',
  description: 'Your comprehensive digital repository for the Nimble tabletop role-playing game system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700&family=Alegreya+Sans:wght@900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="flex h-screen flex-col">
          <TopNav />
          <div className="flex flex-1">
            <SidebarWrapper />
            <div className="flex-1 flex flex-col">
              <div className="bg-white border-b border-border p-4 flex items-center justify-between">
                <SearchBar />
              </div>
              <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-card to-secondary">
                {children}
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}