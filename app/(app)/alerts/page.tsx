'use client'

import { useEffect, useState, FormEvent } from 'react'
import { Loader2, Bell, BellOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { getPushSubscriptionState, subscribeToPush, unsubscribeFromPush } from '@/lib/push'
import { PROPERTY_TYPE_LABELS, PropertyType, SavedSearch } from '@/lib/types'

export default function AlertsPage() {
  const { id: userId } = useCurrentUser()
  const { t, locale } = useTranslation()

  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [pushState, setPushState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default')
  const [togglingPush, setTogglingPush] = useState(false)
  const [pushError, setPushError] = useState('')

  const [propertyType, setPropertyType] = useState<PropertyType | 'tous'>('tous')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data }, state] = await Promise.all([
        supabase
          .from('saved_searches')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        getPushSubscriptionState(),
      ])
      setSearches((data as SavedSearch[]) ?? [])
      setPushState(state)
      setLoading(false)
    }
    load()
  }, [userId])

  async function togglePush() {
    setTogglingPush(true)
    setPushError('')
    try {
      if (pushState === 'granted') {
        await unsubscribeFromPush()
        setPushState(await getPushSubscriptionState())
      } else {
        const { error: subError } = await subscribeToPush(userId)
        if (subError) {
          setPushError(subError)
          return
        }
        setPushState('granted')
      }
    } finally {
      setTogglingPush(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { data, error: insertError } = await supabase
        .from('saved_searches')
        .insert({
          user_id: userId,
          property_type: propertyType === 'tous' ? null : propertyType,
          min_budget: minBudget ? Number(minBudget) : null,
          max_budget: maxBudget ? Number(maxBudget) : null,
          location_query: locationQuery.trim() || null,
        })
        .select('*')
        .single()

      if (insertError || !data) {
        setError(t('alerts.createError'))
        return
      }
      setSearches((prev) => [data as SavedSearch, ...prev])
      setPropertyType('tous')
      setMinBudget('')
      setMaxBudget('')
      setLocationQuery('')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSearch(id: string) {
    await supabase.from('saved_searches').delete().eq('id', id)
    setSearches((prev) => prev.filter((s) => s.id !== id))
  }

  function describeSearch(search: SavedSearch) {
    const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US'
    const parts: string[] = []
    parts.push(search.property_type ? t(`propertyType.${search.property_type}`) : t('alerts.anyType'))
    if (search.min_budget || search.max_budget) {
      parts.push(
        `${search.min_budget ? search.min_budget.toLocaleString(numberLocale) : '0'}–${
          search.max_budget ? search.max_budget.toLocaleString(numberLocale) : '∞'
        } FCFA`
      )
    }
    if (search.location_query) parts.push(`« ${search.location_query} »`)
    return parts.join(' · ')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">{t('alerts.title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('alerts.subtitle')}</p>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {pushState === 'granted' ? (
            <Bell className="size-5 text-[#D4AF37]" />
          ) : (
            <BellOff className="size-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{t('alerts.pushTitle')}</p>
            <p className="text-xs text-muted-foreground">
              {pushState === 'granted' && t('alerts.pushEnabled')}
              {pushState === 'denied' && t('alerts.pushBlocked')}
              {pushState === 'default' && t('alerts.pushDisabled')}
              {pushState === 'unsupported' && t('alerts.pushUnsupported')}
            </p>
          </div>
        </div>
        {pushState !== 'unsupported' && pushState !== 'denied' && (
          <Button size="sm" variant="outline" onClick={togglePush} disabled={togglingPush}>
            {togglingPush && <Loader2 className="size-4 animate-spin" />}
            {pushState === 'granted' ? t('alerts.disable') : t('alerts.enable')}
          </Button>
        )}
      </div>
      {pushError && <p className="mb-4 text-xs text-destructive">{pushError}</p>}

      <form
        onSubmit={handleCreate}
        className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <p className="text-sm font-medium text-foreground">{t('alerts.newAlert')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t('home.propertyType')}</Label>
            <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType | 'tous')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('home.all')}</SelectItem>
                {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`propertyType.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="locationQuery">{t('alerts.neighborhood')}</Label>
            <Input
              id="locationQuery"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder={t('alerts.neighborhoodPlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minBudget">{t('home.minBudget')}</Label>
            <Input
              id="minBudget"
              type="number"
              min={0}
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxBudget">{t('home.maxBudget')}</Label>
            <Input
              id="maxBudget"
              type="number"
              min={0}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="500000"
            />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={saving} className="self-start">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {t('alerts.createAlert')}
        </Button>
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
        </div>
      )}

      {!loading && searches.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">{t('alerts.noAlerts')}</p>
      )}

      {!loading && searches.length > 0 && (
        <div className="flex flex-col gap-2">
          {searches.map((search) => (
            <Card key={search.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <p className="text-sm text-foreground">{describeSearch(search)}</p>
                <button
                  type="button"
                  onClick={() => deleteSearch(search.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
