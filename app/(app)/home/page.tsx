'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, SlidersHorizontal, Search, BellPlus, MapPinOff } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { PropertyCard } from '@/components/PropertyCard'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { isBoosted } from '@/lib/boost'
import { PropertyWithOwner, PropertyType } from '@/lib/types'
import { CITIES, getCity } from '@/lib/cities'

const AMENITIES = ['Eau', 'Électricité', 'Cuisine', 'Parking', 'Sécurité', 'Meublé', 'Climatisation']

export default function HomePage() {
  const { userType, id: userId } = useCurrentUser()
  const { t } = useTranslation()
  const [properties, setProperties] = useState<PropertyWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('tous')
  const [propertyType, setPropertyType] = useState('tous')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [bedrooms, setBedrooms] = useState('tous')
  const [amenities, setAmenities] = useState<string[]>([])
  const [savingAlert, setSavingAlert] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)

  useEffect(() => {
    async function loadProperties() {
      setLoading(true)
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*, owner:profiles!owner_id(verified)')
          .eq('status', 'disponible')
          .eq('approved', true)
          .order('created_at', { ascending: false })

        if (fetchError) {
          setError(t('home.loadError'))
          return
        }
        setProperties((data as PropertyWithOwner[]) ?? [])
      } catch {
        setError(t('home.loadError'))
      } finally {
        setLoading(false)
      }
    }
    loadProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveAlert() {
    setSavingAlert(true)
    setAlertSaved(false)
    try {
      await supabase.from('saved_searches').insert({
        user_id: userId,
        property_type: propertyType === 'tous' ? null : (propertyType as PropertyType),
        min_budget: minBudget ? Number(minBudget) : null,
        max_budget: maxBudget ? Number(maxBudget) : null,
        location_query: searchQuery.trim() || null,
      })
      setAlertSaved(true)
    } finally {
      setSavingAlert(false)
    }
  }

  function toggleAmenity(amenity: string) {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return properties.filter((property) => {
      if (
        query &&
        !property.title.toLowerCase().includes(query) &&
        !property.location.toLowerCase().includes(query)
      )
        return false
      if (city !== 'tous' && property.city !== city) return false
      if (propertyType !== 'tous' && property.property_type !== propertyType) return false
      if (minBudget && property.price_fcfa < Number(minBudget)) return false
      if (maxBudget && property.price_fcfa > Number(maxBudget)) return false
      if (bedrooms !== 'tous' && property.bedrooms < Number(bedrooms)) return false
      if (amenities.length > 0 && !amenities.every((a) => property.amenities?.includes(a)))
        return false
      return true
    })
  }, [properties, searchQuery, city, propertyType, minBudget, maxBudget, bedrooms, amenities])

  const sortedProperties = useMemo(
    () =>
      [...filteredProperties].sort(
        (a, b) => Number(isBoosted(b.boosted_until)) - Number(isBoosted(a.boosted_until))
      ),
    [filteredProperties]
  )

  const selectedCity = city !== 'tous' ? getCity(city) : undefined
  const cityNotCovered = selectedCity ? !selectedCity.active : false

  return (
    <div className="min-h-screen bg-[#150826]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-[#FFD400] sm:text-3xl">
            {t('home.title')}
          </h1>
          <p className="mt-2 font-body text-lg font-medium text-[#B9A7DE]">
            {loading ? t('common.loading') : `${filteredProperties.length} ${t('home.listingsAvailable')}`}
          </p>
        </div>
        {userType === 'propriétaire' && (
          <Button
            asChild
            className="border-2 border-[#0a0417] bg-[#FFD400] font-body text-sm font-bold tracking-wide text-[#0a0417] uppercase arcade-shadow-sm arcade-press hover:bg-[#FFD400]"
          >
            <Link href="/property/create">
              <Plus className="size-4" />
              {t('home.publish')}
            </Link>
          </Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#B9A7DE]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('home.searchPlaceholder')}
          className="border-2 border-[#0a0417] bg-[#1F0F3D] pl-9 font-body text-lg font-medium text-[#FFF6E0] placeholder:text-[#B9A7DE] focus-visible:border-[#00E5FF] focus-visible:ring-[#00E5FF]/40"
        />
      </div>

      {userType !== 'propriétaire' && (
        <div className="mb-6 border-2 border-[#0a0417] bg-[#1F0F3D] p-4 arcade-shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-body text-sm font-bold tracking-wide text-[#00E5FF] uppercase">
            <SlidersHorizontal className="size-4" />
            {t('home.filters')}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city" className="font-body text-base font-medium text-[#FFF6E0]">
                {t('home.city')}
              </Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger
                  id="city"
                  className="w-full border-2 border-[#0a0417] bg-[#150826] font-body text-base font-medium text-[#FFF6E0]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">{t('home.allCities')}</SelectItem>
                  {CITIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {t(`cities.${c.id}`)}
                      {!c.active ? ` · ${t('cities.comingSoon')}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="propertyType" className="font-body text-base font-medium text-[#FFF6E0]">
                {t('home.propertyType')}
              </Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger
                  id="propertyType"
                  className="w-full border-2 border-[#0a0417] bg-[#150826] font-body text-base font-medium text-[#FFF6E0]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">{t('home.all')}</SelectItem>
                  <SelectItem value="chambre">{t('propertyType.chambre')}</SelectItem>
                  <SelectItem value="studio">{t('propertyType.studio')}</SelectItem>
                  <SelectItem value="appartement">{t('propertyType.appartement')}</SelectItem>
                  <SelectItem value="villa">{t('propertyType.villa')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minBudget" className="font-body text-base font-medium text-[#FFF6E0]">
                {t('home.minBudget')}
              </Label>
              <Input
                id="minBudget"
                type="number"
                min={0}
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="0"
                className="border-2 border-[#0a0417] bg-[#150826] font-body text-base text-[#FFF6E0] placeholder:text-[#B9A7DE] focus-visible:border-[#00E5FF] focus-visible:ring-[#00E5FF]/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxBudget" className="font-body text-base font-medium text-[#FFF6E0]">
                {t('home.maxBudget')}
              </Label>
              <Input
                id="maxBudget"
                type="number"
                min={0}
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="500000"
                className="border-2 border-[#0a0417] bg-[#150826] font-body text-base text-[#FFF6E0] placeholder:text-[#B9A7DE] focus-visible:border-[#00E5FF] focus-visible:ring-[#00E5FF]/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bedrooms" className="font-body text-base font-medium text-[#FFF6E0]">
                {t('home.minBedrooms')}
              </Label>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger
                  id="bedrooms"
                  className="w-full border-2 border-[#0a0417] bg-[#150826] font-body text-base font-medium text-[#FFF6E0]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">{t('home.allF')}</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-body text-base font-medium text-[#FFF6E0]">{t('home.amenities')}</Label>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-1.5 font-body text-base font-medium text-[#B9A7DE]"
                  >
                    <Checkbox
                      checked={amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                      className="border-[#0a0417] data-checked:border-[#39FF6A] data-checked:bg-[#39FF6A]"
                    />
                    {t(`amenities.${amenity}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t-2 border-[#2a1650] pt-3">
            <Button
              type="button"
              size="sm"
              onClick={saveAlert}
              disabled={savingAlert}
              className="border-2 border-[#0a0417] bg-[#FF2E8C] font-body text-sm font-bold tracking-wide text-[#0a0417] uppercase arcade-shadow-sm arcade-press hover:bg-[#FF2E8C]"
            >
              {savingAlert ? <Loader2 className="size-4 animate-spin" /> : <BellPlus className="size-4" />}
              {t('home.createAlert')}
            </Button>
            {alertSaved && (
              <span className="font-body text-base font-medium text-[#B9A7DE]">
                {t('home.alertCreated')}{' '}
                <Link href="/alerts" className="font-medium text-[#FFD400] hover:underline">
                  {t('home.manageAlerts')}
                </Link>
              </span>
            )}
          </div>
        </div>
      )}

      {cityNotCovered ? (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-[#2a1650] p-12 text-center">
          <MapPinOff className="size-8 text-[#B9A7DE]" />
          <div>
            <p className="font-body text-lg font-semibold text-[#FFF6E0]">{t('home.cityNotCoveredTitle')}</p>
            <p className="mt-1 font-body text-base font-medium text-[#B9A7DE]">{t('home.cityNotCoveredBody')}</p>
          </div>
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-[#FFD400]" />
            </div>
          )}

          {!loading && error && (
            <p className="border-2 border-[#FF3B3B] bg-[#FF3B3B]/10 p-4 font-body text-base font-medium text-[#FF3B3B]">
              {error}
            </p>
          )}

          {!loading && !error && sortedProperties.length === 0 && (
            <div className="border-2 border-dashed border-[#2a1650] p-12 text-center font-body text-lg font-medium text-[#B9A7DE]">
              {t('home.noResults')}
            </div>
          )}

          {!loading && !error && sortedProperties.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  ownerVerified={property.owner?.verified ?? false}
                />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
