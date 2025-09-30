import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/navigation/Sidebar'
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
      <body>
        <div className="flex h-screen flex-col">
          <TopNav />
          <div className="flex flex-1">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <div className="bg-white border-b border-amber-200 p-4 flex items-center justify-between">
                <SearchBar />
              </div>
              <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-amber-50 to-amber-100">
                {children}
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}