'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, Trash2, Pencil, RefreshCw, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { requestBoost, isBoosted, BOOST_PRICE_FCFA, BOOST_DURATION_DAYS } from '@/lib/boost'
import { Property } from '@/lib/types'

const STATUS_OPTIONS: Property['status'][] = ['disponible', 'louée', 'maintenance']

export default function MyPropertiesPage() {
  const { userType, id: userId } = useCurrentUser()
  const { t, locale } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [boostRequestedIds, setBoostRequestedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (userType !== 'propriétaire') {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) {
          setError(t('myProperties.loadError'))
          return
        }
        setProperties((data as Property[]) ?? [])
      } catch {
        setError(t('myProperties.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, userId])

  function withPending(id: string, fn: () => Promise<void>) {
    setPendingIds((prev) => new Set(prev).add(id))
    fn().finally(() => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }

  function updateStatus(id: string, status: Property['status']) {
    withPending(id, async () => {
      await supabase.from('properties').update({ status }).eq('id', id)
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    })
  }

  function deleteProperty(id: string) {
    withPending(id, async () => {
      await supabase.from('properties').delete().eq('id', id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
    })
  }

  function renewProperty(id: string) {
    withPending(id, async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await supabase
        .from('properties')
        .update({ expires_at: expiresAt, expiry_notified: false })
        .eq('id', id)
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, expires_at: expiresAt } : p)))
    })
  }

  function boostProperty(property: Property) {
    withPending(property.id, async () => {
      const { error: requestError } = await requestBoost(
        userId,
        `${t('myProperties.boostRequestMessage')}\n« ${property.title} »`
      )
      if (!requestError) {
        setBoostRequestedIds((prev) => new Set(prev).add(property.id))
      }
    })
  }

  if (userType !== 'propriétaire') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{t('myProperties.ownerOnly')}</p>
        <Button asChild variant="outline">
          <Link href="/home">{t('common.backToHome')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t('myProperties.title')}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/contract/list">{t('contract.myContracts')}</Link>
          </Button>
          <Button asChild>
            <Link href="/property/create">
              <Plus className="size-4" />
              {t('home.publish')}
            </Link>
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#FFD400]" />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {t('myProperties.noListings')}
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="flex flex-col gap-3">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/property/${property.id}`}
                      className="truncate font-medium text-foreground hover:underline"
                    >
                      {property.title}
                    </Link>
                    <Badge variant="secondary" className="shrink-0">
                      {t(`propertyType.${property.property_type}`)}
                    </Badge>
                    {!property.approved && (
                      <Badge className="shrink-0 bg-[#FFD400]/20 text-[#FFD400] border border-[#FFD400]/40 hover:bg-[#FFD400]/20">
                        {t('property.pendingApproval')}
                      </Badge>
                    )}
                    {isBoosted(property.boosted_until) && (
                      <Badge className="shrink-0 bg-[#FF2E8C]/20 text-[#FF2E8C] border border-[#FF2E8C]/40 hover:bg-[#FF2E8C]/20">
                        <Rocket className="size-3" />
                        {t('myProperties.boosted')}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {property.location} ·{' '}
                    {property.price_fcfa.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} FCFA
                  </p>
                  {isBoosted(property.boosted_until) ? (
                    <p className="text-xs text-[#FF2E8C]">
                      {t('myProperties.boostedUntil')}{' '}
                      {new Date(property.boosted_until!).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  ) : boostRequestedIds.has(property.id) ? (
                    <p className="text-xs text-[#39FF6A]">{t('myProperties.boostRequestSent')}</p>
                  ) : (
                    property.approved && (
                      <button
                        type="button"
                        onClick={() => boostProperty(property)}
                        disabled={pendingIds.has(property.id)}
                        className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#FF2E8C] hover:underline"
                      >
                        <Rocket className="size-3" />
                        {t('myProperties.boostButton')} · {BOOST_PRICE_FCFA.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} FCFA / {BOOST_DURATION_DAYS}{' '}
                        {t('myProperties.days')}
                      </button>
                    )
                  )}
                  {property.expires_at && (
                    <p
                      className={`text-xs ${
                        new Date(property.expires_at).getTime() - Date.now() < 3 * 86400000
                          ? 'text-[#FFD400]'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {t('myProperties.expiresOn')}{' '}
                      {new Date(property.expires_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {property.expires_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => renewProperty(property.id)}
                      disabled={pendingIds.has(property.id)}
                      aria-label={t('myProperties.renew')}
                      title={t('myProperties.renewTitle')}
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                  )}
                  <Select
                    value={property.status}
                    onValueChange={(value) =>
                      updateStatus(property.id, value as Property['status'])
                    }
                  >
                    <SelectTrigger disabled={pendingIds.has(property.id)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`myProperties.status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/property/${property.id}/edit`} aria-label={t('common.edit')}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteProperty(property.id)}
                    disabled={pendingIds.has(property.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
