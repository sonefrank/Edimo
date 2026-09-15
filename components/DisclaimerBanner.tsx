'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'

export function DisclaimerBanner() {
  const { t } = useTranslation()

  return (
    <div className="flex gap-3 bg-yellow-50 border-l-4 border-[#FFD400] p-4 mb-4">
      <AlertTriangle className="size-5 shrink-0 text-[#FFD400]" />
      <p className="text-sm text-foreground">{t('disclaimer.text')}</p>
    </div>
  )
}
