import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

import { headers } from "next/headers"; 
import ContextProvider from '@/context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: "Web3 Analysis - AI-Powered Project Analysis Platform",
    template: "%s | Web3 Analysis"
  },
  description: "Professional AI-powered analysis tool for Web3 projects. Get comprehensive insights on blockchain projects, DeFi protocols, and NFT ventures.",
  metadataBase: new URL('https://web3analysis.xyz'),
  alternates: {
    canonical: '/',
  },
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
  keywords: 'Web3, Blockchain Analysis, Crypto Research, DeFi Analysis, NFT Projects, Investment Research, AI Analysis',
  openGraph: {
    type: 'website',
    title: 'Web3 Project Analysis Platform',
    description: 'Professional AI-powered analysis reports for blockchain and Web3 projects',
    images: ['/og-image.jpg'],
    siteName: 'Web3 Analysis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Project Analysis Platform',
    description: 'Professional AI-powered analysis reports for blockchain and Web3 projects',
    images: ['/og-image.jpg'],
    creator: '@web3analysis',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
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