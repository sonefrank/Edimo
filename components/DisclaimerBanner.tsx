'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'

export function DisclaimerBanner() {
  const { t } = useTranslation()

  return (
    <div className="flex gap-3 bg-yellow-50 border-l-4 border-[#D4AF37] p-4 mb-4">
      <AlertTriangle className="size-5 shrink-0 text-[#D4AF37]" />
      <p className="text-sm text-gray-800">{t('disclaimer.text')}</p>
    </div>
  )
}
