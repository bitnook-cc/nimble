import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Nimble Navigator",
  description: "Navigate your adventures with ease - A digital character sheet for Nimble RPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
