'use client'

import { useEffect, useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { createContract } from '@/lib/contract'
import { supabase } from '@/lib/supabase'
import { Property } from '@/lib/types'

function CreateContractForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userType, id: userId } = useCurrentUser()
  const { t } = useTranslation()

  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [propertyId, setPropertyId] = useState(searchParams.get('property') ?? '')
  const [price, setPrice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [durationMonths, setDurationMonths] = useState('12')
  const [locataireName, setLocataireName] = useState('')
  const [locataireEmail, setLocataireEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoadingProperties(true)
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', userId)
        .eq('approved', true)
        .order('created_at', { ascending: false })
      setProperties((data as Property[]) ?? [])
      setLoadingProperties(false)
    }
    load()
  }, [userId])

  const selectedProperty = properties.find((p) => p.id === propertyId)

  useEffect(() => {
    if (selectedProperty) setPrice(String(selectedProperty.price_fcfa))
  }, [selectedProperty])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedProperty) {
      setError(t('contract.selectPropertyError'))
      return
    }

    setLoading(true)
    try {
      const { contract, error: createError } = await createContract({
        propertyId: selectedProperty.id,
        proprietaireId: userId,
        locataireName,
        locataireEmail,
        contractData: {
          propertyTitle: selectedProperty.title,
          priceFcfa: Number(price),
          startDate,
          durationMonths: Number(durationMonths),
        },
      })

      if (createError || !contract) {
        setError(t('contract.createError'))
        return
      }

      router.push(`/contract/${contract.id}/sign`)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (userType !== 'propriétaire') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{t('contract.ownerOnly')}</p>
        <Button asChild variant="outline">
          <Link href="/home">{t('common.backToHome')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[#1a1a1a]">{t('contract.createTitle')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="property">{t('contract.property')}</Label>
          {loadingProperties ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {t('common.loading')}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('contract.noOwnProperties')}</p>
          ) : (
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="property" className="w-full">
                <SelectValue placeholder={t('contract.selectProperty')} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">{t('contract.monthlyPrice')}</Label>
          <Input
            id="price"
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="150000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">{t('contract.startDate')}</Label>
          <Input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="durationMonths">{t('contract.duration')}</Label>
          <Input
            id="durationMonths"
            type="number"
            min={1}
            required
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            placeholder="12"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locataireName">{t('contract.tenantName')}</Label>
          <Input
            id="locataireName"
            required
            value={locataireName}
            onChange={(e) => setLocataireName(e.target.value)}
            placeholder="Marie Ekwalla"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locataireEmail">{t('contract.tenantEmail')}</Label>
          <Input
            id="locataireEmail"
            type="email"
            required
            value={locataireEmail}
            onChange={(e) => setLocataireEmail(e.target.value)}
            placeholder="marie@example.com"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading || properties.length === 0} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? t('contract.creating') : t('contract.createButton')}
        </Button>
      </form>
    </div>
  )
}

export default function CreateContractPage() {
  return (
    <Suspense fallback={null}>
      <CreateContractForm />
    </Suspense>
  )
}
