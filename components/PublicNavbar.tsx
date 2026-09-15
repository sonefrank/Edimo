'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'

export function PublicNavbar() {
  const { t } = useTranslation()

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b-4 border-[#FFD400] bg-[#150826] px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Home className="size-5 text-[#FFD400]" />
        <span className="font-display text-lg tracking-wide text-[#FFD400] sm:text-xl">EDIMO</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="border-2 border-[#0a0417] bg-[#2a1650] px-3 py-1.5 font-body text-sm font-bold tracking-wide text-[#FFF6E0] uppercase arcade-shadow-sm arcade-press transition-colors hover:bg-[#00E5FF] hover:text-[#0a0417]"
        >
          {t('auth.logInButton')}
        </Link>
        <Link
          href="/signup"
          className="border-2 border-[#0a0417] bg-[#FFD400] px-3 py-1.5 font-body text-sm font-bold tracking-wide text-[#0a0417] uppercase arcade-shadow-sm arcade-press hover:bg-[#FFD400]/90"
        >
          {t('auth.signUp')}
        </Link>
        <LanguageToggle />
      </div>
    </nav>
  )
}
