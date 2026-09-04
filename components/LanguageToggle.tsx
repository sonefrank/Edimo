'use client'

import { useTranslation } from '@/components/LanguageProvider'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div
      className={`flex items-center overflow-hidden rounded-full border border-white/20 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t('languageToggle.label')}
    >
      <button
        type="button"
        onClick={() => setLocale('fr')}
        className={`px-2 py-1 transition ${
          locale === 'fr' ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'text-white/70 hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 transition ${
          locale === 'en' ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
