import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

import { headers } from "next/headers"; 
import ContextProvider from '@/context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Web3 Analysis",
  description: "AI-Powered Web3 Project Analysis Tool",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ],
    shortcut: '/icon.svg',
  },
  keywords: 'Web3, Blockchain Analysis, Crypto Research, DeFi Analysis, NFT Projects, Investment Research',
  openGraph: {
    title: 'Web3 Project Analysis Platform',
    description: 'Professional analysis reports for blockchain and Web3 projects',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Project Analysis Platform',
    description: 'Professional analysis reports for blockchain and Web3 projects',
    images: ['/og-image.jpg'],
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieHeader = (await headers()).get('cookie') || undefined

  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider cookies={cookieHeader}>
          {children}
          <div id="modal-root" />
          <Analytics />
        </ContextProvider>
      </body>
    </html>
  )
}