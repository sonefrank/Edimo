'use client'

import Link from 'next/link'
import { Home, Building2, Heart, Bell, MessageCircle, User } from 'lucide-react'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'

export function Navbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { userType } = useCurrentUser()
  const { t } = useTranslation()

  return (
    <nav className="bg-[#1a1a1a] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-[#D4AF37]">
        <Home className="size-5" />
        EDIMO
      </Link>
      <div className="flex gap-5 items-center">
        {userType === 'propriétaire' && (
          <Link
            href="/my-properties"
            className="text-white/80 hover:text-[#D4AF37] transition"
            title={t('nav.myProperties')}
          >
            <Building2 className="size-5" />
          </Link>
        )}
        {userType === 'locataire' && (
          <Link
            href="/alerts"
            className="text-white/80 hover:text-[#D4AF37] transition"
            title={t('nav.alerts')}
          >
            <Bell className="size-5" />
          </Link>
        )}
        <Link
          href="/favorites"
          className="text-white/80 hover:text-[#D4AF37] transition"
          title={t('nav.favorites')}
        >
          <Heart className="size-5" />
        </Link>
        <Link
          href="/messages"
          className="relative text-white/80 hover:text-[#D4AF37] transition"
          title={t('nav.messages')}
        >
          <MessageCircle className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-semibold leading-none text-[#1a1a1a]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/profile"
          className="text-white/80 hover:text-[#D4AF37] transition"
          title={t('nav.profile')}
        >
          <User className="size-5" />
        </Link>
        <LanguageToggle />
      </div>
    </nav>
  )
}
