import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Providers } from '@/app/providers'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://cadence.crafter.run'),
  title: 'Cadence — AI Agent Evaluation',
  description: 'Large-scale parallel testing and optimization for AI agents and LLM-powered systems',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Cadence — AI Agent Evaluation',
    description: 'Large-scale parallel testing and optimization for AI agents and LLM-powered systems',
    url: 'https://cadence.crafter.run',
    siteName: 'Cadence',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Cadence - AI Agent Evaluation' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cadence — AI Agent Evaluation',
    description: 'Large-scale parallel testing and optimization for AI agents and LLM-powered systems',
    images: ['/og-twitter.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{ baseTheme: dark }}
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <html lang="en">
        <body className={`font-sans antialiased`}>
          <Providers>
            {children}
          </Providers>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
