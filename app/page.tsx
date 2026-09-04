'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      router.replace(session ? '/home' : '/signup')
    })

    return () => {
      active = false
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#1a1a1a]">
      {/* logo-full.svg, adapté en clair-sur-sombre pour ce fond noir (voir (auth)/layout.tsx) */}
      <svg width="170" height="140" viewBox="0 0 400 330" role="img" aria-label="Edimo Le Bayeur">
        <g transform="translate(100,20)">
          <path d="M100,30 L165,85 L165,175 L35,175 L35,85 Z" fill="#F5F1E8" />
          <path d="M80,175 L80,140 A20,20 0 0 1 120,140 L120,175 Z" fill="#D4AF37" />
        </g>
        <text
          x="200"
          y="270"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="56"
          letterSpacing="3"
          fill="#F5F1E8"
        >
          EDIMO
        </text>
        <text
          x="200"
          y="305"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="600"
          fontSize="26"
          letterSpacing="6"
          fill="#D4AF37"
        >
          LE BAYEUR
        </text>
      </svg>
      <div className="size-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
  )
}
