'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'

export function ContractDisclaimer() {
  const { t } = useTranslation()

  return (
    <div className="mb-6 rounded-lg border-l-4 border-[#FFD400] bg-yellow-50 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
        <AlertTriangle className="size-4 shrink-0 text-[#FFD400]" />
        {t('contract.draftBadge')}
      </p>
      <p className="text-xs text-foreground">{t('contract.disclaimerBody')}</p>
    </div>
  )
}
