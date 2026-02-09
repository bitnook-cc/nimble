import type { Metadata } from 'next'
import './globals.css'
import { VaultLayout } from '@/components/vault-layout'

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
        <VaultLayout>{children}</VaultLayout>
      </body>
    </html>
  )
}