import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-serif',
})
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Glow Beauty Blog | Hair, Makeup, Skincare & Nail Inspiration',
    template: '%s | Glow Beauty Blog',
  },
  description: 'Your destination for hair styling, makeup tutorials, skincare routines and nail art inspiration. Expert tips from professional stylists.',
  keywords: ['beauty blog', 'hair styling', 'makeup tutorials', 'skincare', 'nail art', 'salon', 'beauty tips'],
  authors: [{ name: 'Glow Beauty' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Glow Beauty Blog',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
