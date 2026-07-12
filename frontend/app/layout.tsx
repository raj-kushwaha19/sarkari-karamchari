import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sarkari Karamchari — Aapki Awaaz, Sidha Samadhan',
  description: 'AI-powered citizen grievance platform. File complaints, track status, and escalate to representatives. Powered by Gen-Z Solutions.',
  keywords: 'citizen grievance, government complaint, sarkari, india, civic platform',
  authors: [{ name: 'Gen-Z Solutions' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-outfit">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
