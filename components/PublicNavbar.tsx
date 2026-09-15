'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'

export function PublicNavbar() {
  const { t } = useTranslation()

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b-4 border-[#FFD400] bg-[#150826] px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
      <Link href="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Home className="size-5 shrink-0 text-[#FFD400]" />
        <span className="font-display text-base tracking-wide text-[#FFD400] sm:text-xl">EDIMO</span>
      </Link>
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-3">
        <Link
          href="/login"
          className="shrink-0 border-2 border-[#0a0417] bg-[#2a1650] px-2.5 py-1.5 font-body text-xs font-bold tracking-wide text-[#FFF6E0] uppercase arcade-shadow-sm arcade-press transition-colors hover:bg-[#00E5FF] hover:text-[#0a0417] sm:px-3 sm:text-sm"
        >
          {t('auth.logInButton')}
        </Link>
        <Link
          href="/signup"
          className="shrink-0 border-2 border-[#0a0417] bg-[#FFD400] px-2.5 py-1.5 font-body text-xs font-bold tracking-wide text-[#0a0417] uppercase arcade-shadow-sm arcade-press hover:bg-[#FFD400]/90 sm:px-3 sm:text-sm"
        >
          {t('auth.signUp')}
        </Link>
        <LanguageToggle className="shrink-0" />
      </div>
    </nav>
  )
}
