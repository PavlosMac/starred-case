import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Starred Case - Launch Your Career',
  description:
    'Discover extraordinary opportunities - Your next career move awaits among the stars',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Syne:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="w-full max-w-3xl mx-auto pt-10 px-6 pb-12">
          {children}
        </div>
      </body>
    </html>
  )
}
