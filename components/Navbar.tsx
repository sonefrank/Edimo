'use client'

import Link from 'next/link'
import { Home, Building2, Heart, Bell, MessageCircle, User, FileText } from 'lucide-react'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'

const navIcon =
  'flex size-8 sm:size-9 shrink-0 items-center justify-center border-2 border-[#0a0417] bg-[#2a1650] text-[#B9A7DE] arcade-shadow-sm arcade-press transition-colors hover:bg-[#00E5FF] hover:text-[#0a0417]'

export function Navbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { userType } = useCurrentUser()
  const { t } = useTranslation()

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b-4 border-[#FFD400] bg-[#150826] px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
      <Link href="/home" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Home className="size-5 shrink-0 text-[#FFD400]" />
        <span className="font-display text-base tracking-wide text-[#FFD400] sm:text-xl">EDIMO</span>
      </Link>
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-3">
        {userType === 'propriétaire' && (
          <Link href="/my-properties" className={navIcon} title={t('nav.myProperties')}>
            <Building2 className="size-4" />
          </Link>
        )}
        {userType === 'locataire' && (
          <Link href="/alerts" className={navIcon} title={t('nav.alerts')}>
            <Bell className="size-4" />
          </Link>
        )}
        <Link href="/contract/list" className={navIcon} title={t('nav.contracts')}>
          <FileText className="size-4" />
        </Link>
        <Link href="/favorites" className={navIcon} title={t('nav.favorites')}>
          <Heart className="size-4" />
        </Link>
        <Link href="/messages" className={`relative ${navIcon}`} title={t('nav.messages')}>
          <MessageCircle className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex min-w-4.5 items-center justify-center border-2 border-[#0a0417] bg-[#FF2E8C] px-1 font-body text-xs font-semibold leading-none text-[#0a0417]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link href="/profile" className={navIcon} title={t('nav.profile')}>
          <User className="size-4" />
        </Link>
        <LanguageToggle className="shrink-0" />
      </div>
    </nav>
  )
}
