import type { Metadata } from 'next'
import './globals.css'
import { VaultLayout } from '@/components/vault-layout'
import { getUserTags } from '@/lib/access'

export const metadata: Metadata = {
  title: 'Nimble RPG Vault',
  description: 'Your comprehensive digital repository for the Nimble tabletop role-playing game system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user tags server-side
  const userTags = await getUserTags()
  const tags = userTags.length > 0 ? userTags : ['public']

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
        <VaultLayout userTags={tags}>{children}</VaultLayout>
      </body>
    </html>
  )
}