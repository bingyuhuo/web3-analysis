"use client";

import { useRouter } from 'next/navigation'

export default function PricingButton() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/pricing')
  }

  return (
    <button
      onClick={handleClick}
      className="px-6 py-2 hover:text-gray-600"
    >
      pricing
    </button>
  )
} 