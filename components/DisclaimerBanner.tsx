'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'

export function DisclaimerBanner() {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex gap-3 border-2 border-[#0a0417] bg-[#FFD400] p-4 arcade-shadow-sm">
      <AlertTriangle className="size-5 shrink-0 text-[#0a0417]" />
      <p className="font-body text-base font-semibold text-[#0a0417]">{t('disclaimer.text')}</p>
    </div>
  )
}
