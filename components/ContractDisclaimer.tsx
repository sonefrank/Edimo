'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'

export function ContractDisclaimer() {
  const { t } = useTranslation()

  return (
    <div className="mb-6 border-2 border-[#0a0417] bg-[#FFD400] p-4 arcade-shadow-sm">
      <p className="mb-1 flex items-center gap-2 font-body text-base font-bold text-[#0a0417]">
        <AlertTriangle className="size-4 shrink-0 text-[#0a0417]" />
        {t('contract.draftBadge')}
      </p>
      <p className="font-body text-sm font-medium text-[#0a0417]">{t('contract.disclaimerBody')}</p>
    </div>
  )
}
