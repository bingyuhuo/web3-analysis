"use client";

import Link from 'next/link'
import Image from 'next/image'
import WalletConnect from '../wallet-connect'
import PricingButton from '../pricing-button'


export default function Header() {

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="w-full flex h-16 items-center justify-between px-4">
        <div className="flex items-center pl-2">
          <Link href="/" className="flex items-center space-x-4">
            <Image
              src="/icon.svg"
              alt="Web3 Analysis Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Web3 Analysis
            </div>
          </Link>
        </div>
        
        <div className="flex items-center mr-4 space-x-4">
          <PricingButton />
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
