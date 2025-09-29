import './globals.css'

export const metadata = {
  title: 'Nimble Portal',
  description: 'Unified portal for Nimble RPG tools and resources',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
