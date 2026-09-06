'use client'

import { useEffect, useRef, useState, ChangeEvent } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { getContract, signContract } from '@/lib/contract'
import { supabase } from '@/lib/supabase'
import { Contract } from '@/lib/types'
import { ContractDisclaimer } from '@/components/ContractDisclaimer'
import { SignatureCanvasInput } from '@/components/SignatureCanvas'
import { ContractPDF, ContractPDFData } from '@/components/ContractPDF'

interface PartyProfile {
  full_name: string
  email: string
}

export default function SignContractPage() {
  const params = useParams<{ id: string }>()
  const { id: userId } = useCurrentUser()
  const { t } = useTranslation()

  const [contract, setContract] = useState<Contract | null>(null)
  const [proprietaire, setProprietaire] = useState<PartyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw')
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: loadError } = await getContract(params.id)
      if (loadError || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setContract(data)

      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.proprietaire_id)
        .single()
      setProprietaire((ownerProfile as PartyProfile) ?? null)

      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !contract) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{t('contract.notFound')}</p>
        <Button asChild variant="outline">
          <Link href="/home">{t('common.backToHome')}</Link>
        </Button>
      </div>
    )
  }

  const role: 'proprietaire' | 'locataire' | null =
    userId === contract.proprietaire_id ? 'proprietaire' : userId === contract.locataire_id ? 'locataire' : null

  if (!role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{t('contract.notAParty')}</p>
        <Button asChild variant="outline">
          <Link href="/home">{t('common.backToHome')}</Link>
        </Button>
      </div>
    )
  }

  const alreadySigned =
    role === 'proprietaire' ? Boolean(contract.proprietaire_signature) : Boolean(contract.locataire_signature)

  const statusLabel =
    contract.status === 'signed_draft'
      ? t('contract.statusSigned')
      : contract.status === 'partially_signed'
        ? t('contract.statusPartial')
        : t('contract.statusDraft')

  const pdfData: ContractPDFData = {
    propertyTitle: contract.contract_data.propertyTitle,
    priceFcfa: contract.contract_data.priceFcfa,
    startDate: contract.contract_data.startDate,
    durationMonths: contract.contract_data.durationMonths,
    proprietaireName: proprietaire?.full_name ?? '',
    proprietaireEmail: proprietaire?.email ?? '',
    locataireName: contract.locataire_name,
    locataireEmail: contract.locataire_email,
    proprietaireSignature: contract.proprietaire_signature,
    locataireSignature: contract.locataire_signature,
  }

  async function handleSign() {
    if (!capturedSignature) {
      setError(t('contract.pleaseSign'))
      return
    }
    setError('')
    setSigning(true)
    try {
      const { data, error: signError } = await signContract(contract!.id, role!, capturedSignature)
      if (signError || !data) {
        setError(t('contract.signError'))
        return
      }
      setContract(data)
    } finally {
      setSigning(false)
    }
  }

  async function handleDownloadPdf() {
    if (!pdfRef.current) return
    setDownloadingPdf(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: 0,
          filename: `contrat-${contract!.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(pdfRef.current)
        .save()
    } finally {
      setDownloadingPdf(false)
    }
  }

  function handleUploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCapturedSignature(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">{t('contract.signTitle')}</h1>
        <Badge variant={contract.status === 'signed_draft' ? 'default' : 'secondary'}>{statusLabel}</Badge>
      </div>

      <ContractDisclaimer />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="origin-top-left scale-[0.42] sm:scale-[0.6] lg:scale-100">
          <ContractPDF ref={pdfRef} data={pdfData} />
        </div>
      </div>

      {contract.status === 'signed_draft' ? (
        <Button onClick={handleDownloadPdf} disabled={downloadingPdf} className="mt-6 w-full">
          {downloadingPdf ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {downloadingPdf ? t('contract.generatingPdf') : t('contract.downloadPdf')}
        </Button>
      ) : alreadySigned ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">{t('contract.alreadySigned')}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
          <Tabs
            value={signatureMethod}
            onValueChange={(value) => {
              setSignatureMethod(value as 'draw' | 'upload')
              setCapturedSignature(null)
            }}
          >
            <TabsList>
              <TabsTrigger value="draw">{t('contract.drawOption')}</TabsTrigger>
              <TabsTrigger value="upload">{t('contract.uploadOption')}</TabsTrigger>
            </TabsList>
            <TabsContent value="draw">
              <SignatureCanvasInput
                onSignatureCaptured={setCapturedSignature}
                onClear={() => setCapturedSignature(null)}
              />
            </TabsContent>
            <TabsContent value="upload">
              <input type="file" accept="image/*" onChange={handleUploadImage} className="text-sm" />
              {capturedSignature && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-muted-foreground">{t('contract.uploadedPreview')}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedSignature}
                    alt={t('contract.imageUploaded')}
                    className="max-h-24 rounded border border-gray-300"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} />
            <Label htmlFor="agree" className="text-sm font-normal">
              {t('contract.agreeCheckbox')}
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSign} disabled={signing || !agreed || !capturedSignature}>
            {signing && <Loader2 className="size-4 animate-spin" />}
            {signing ? t('contract.signing') : t('contract.signButton')}
          </Button>
        </div>
      )}
    </div>
  )
}
