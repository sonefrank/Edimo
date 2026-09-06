'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { getUserContracts } from '@/lib/contract'
import { Contract } from '@/lib/types'

export default function ContractListPage() {
  const { id: userId, userType } = useCurrentUser()
  const { t, locale } = useTranslation()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getUserContracts(userId)
      setContracts(data)
      setLoading(false)
    }
    load()
  }, [userId])

  function statusLabel(status: Contract['status']) {
    if (status === 'signed_draft') return t('contract.statusSigned')
    if (status === 'partially_signed') return t('contract.statusPartial')
    return t('contract.statusDraft')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">{t('contract.myContracts')}</h1>
        {userType === 'propriétaire' && (
          <Button asChild size="sm">
            <Link href="/contract/create">
              <Plus className="size-4" />
              {t('contract.createTitle')}
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <FileText className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('contract.noContracts')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/contract/${contract.id}/sign`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-[#D4AF37]"
            >
              <div>
                <p className="font-medium text-[#1a1a1a]">{contract.contract_data.propertyTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {contract.locataire_name} ·{' '}
                  {new Date(contract.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                </p>
              </div>
              <Badge variant={contract.status === 'signed_draft' ? 'default' : 'secondary'}>
                {statusLabel(contract.status)}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
