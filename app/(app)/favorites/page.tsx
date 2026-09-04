'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { PropertyWithOwner } from '@/lib/types'

export default function FavoritesPage() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<PropertyWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: favorites, error: fetchError } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', user.id)

        if (fetchError) {
          setError(t('favorites.loadError'))
          return
        }

        const propertyIds = (favorites ?? []).map((f) => f.property_id)
        if (propertyIds.length === 0) {
          setProperties([])
          return
        }

        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*, owner:profiles!owner_id(verified)')
          .in('id', propertyIds)

        if (propertiesError) {
          setError(t('favorites.loadError'))
          return
        }
        setProperties((propertiesData as PropertyWithOwner[]) ?? [])
      } catch {
        setError(t('favorites.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[#1a1a1a]">{t('favorites.title')}</h1>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-muted-foreground">
          {t('favorites.empty')}
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              ownerVerified={property.owner?.verified ?? false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
