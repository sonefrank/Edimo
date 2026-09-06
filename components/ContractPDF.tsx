'use client'

import { forwardRef } from 'react'
import { useTranslation } from '@/components/LanguageProvider'

export interface ContractPDFData {
  propertyTitle: string
  priceFcfa: number
  startDate: string
  durationMonths: number
  proprietaireName: string
  proprietaireEmail: string
  locataireName: string
  locataireEmail: string
  proprietaireSignature?: string | null
  locataireSignature?: string | null
}

function calculateEndDate(startDate: string, months: number, locale: string): string {
  const date = new Date(startDate)
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')
}

export const ContractPDF = forwardRef<HTMLDivElement, { data: ContractPDFData }>(({ data }, ref) => {
  const { t, locale } = useTranslation()

  return (
    <div ref={ref} className="bg-white p-12 text-black" style={{ width: '210mm', minHeight: '297mm' }}>
      <h1 className="mb-8 text-center text-4xl font-bold">{t('contract.title')}</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 border-b pb-8">
        <div>
          <p className="font-bold">{t('contract.landlord')}</p>
          <p>{data.proprietaireName}</p>
          <p className="text-sm text-gray-600">{data.proprietaireEmail}</p>
        </div>
        <div>
          <p className="font-bold">{t('contract.tenant')}</p>
          <p>{data.locataireName}</p>
          <p className="text-sm text-gray-600">{data.locataireEmail}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold">{t('contract.rentedProperty')}</h2>
        <div className="space-y-2 border-l-4 border-[#D4AF37] pl-4">
          <p>
            <strong>{t('contract.titleLabel')}:</strong> {data.propertyTitle}
          </p>
          <p>
            <strong>{t('contract.monthlyRent')}:</strong> {data.priceFcfa.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} FCFA
          </p>
          <p>
            <strong>{t('contract.startDateLabel')}:</strong>{' '}
            {new Date(data.startDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
          </p>
          <p>
            <strong>{t('contract.durationLabel')}:</strong> {data.durationMonths} {t('contract.months')}
          </p>
          <p>
            <strong>{t('contract.endDate')}:</strong>{' '}
            {calculateEndDate(data.startDate, data.durationMonths, locale)}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold">{t('contract.mainClauses')}</h2>
        <ol className="space-y-3 text-sm">
          <li>1. {t('contract.clause1')}</li>
          <li>2. {t('contract.clause2')}</li>
          <li>3. {t('contract.clause3')}</li>
          <li>4. {t('contract.clause4')}</li>
          <li>5. {t('contract.clause5')}</li>
          <li>6. {t('contract.clause6')}</li>
          <li>7. {t('contract.clause7')}</li>
        </ol>
      </div>

      <div className="mb-8 border-t-2 border-gray-300 pt-8">
        <h2 className="mb-8 text-lg font-bold">{t('contract.signatures')}</h2>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="mb-8 font-bold">{t('contract.landlordSignature')}</p>
            <div className="mb-4 flex h-24 items-center justify-center rounded border border-gray-300">
              {data.proprietaireSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.proprietaireSignature} alt={t('contract.landlordSignature')} className="max-h-20 max-w-full" />
              ) : (
                <span className="text-xs text-gray-400">{t('contract.notSignedYet')}</span>
              )}
            </div>
            <div className="border-t-2 border-black pt-2">
              <p className="text-xs">
                {t('contract.name')}: {data.proprietaireName}
              </p>
              <p className="text-xs">{t('contract.date')}: _______________</p>
            </div>
          </div>

          <div>
            <p className="mb-8 font-bold">{t('contract.tenantSignature')}</p>
            <div className="mb-4 flex h-24 items-center justify-center rounded border border-gray-300">
              {data.locataireSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.locataireSignature} alt={t('contract.tenantSignature')} className="max-h-20 max-w-full" />
              ) : (
                <span className="text-xs text-gray-400">{t('contract.notSignedYet')}</span>
              )}
            </div>
            <div className="border-t-2 border-black pt-2">
              <p className="text-xs">
                {t('contract.name')}: {data.locataireName}
              </p>
              <p className="text-xs">{t('contract.date')}: _______________</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t-2 border-[#D4AF37] pt-8">
        <p className="text-center text-xs text-gray-500">🟡 {t('contract.pdfFooter')}</p>
      </div>
    </div>
  )
})

ContractPDF.displayName = 'ContractPDF'
