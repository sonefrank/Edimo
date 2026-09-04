'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyForm } from '@/components/PropertyForm'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { Property } from '@/lib/types'

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>()
  const { id: userId } = useCurrentUser()
  const { t } = useTranslation()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError || !data) {
        setError(t('myProperties.notFound'))
      } else if (data.owner_id !== userId) {
        setError(t('myProperties.notYourListing'))
      } else {
        setProperty(data as Property)
      }
      setLoading(false)
    }
    if (params.id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, userId])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link href="/my-properties">{t('myProperties.backToMyListings')}</Link>
        </Button>
      </div>
    )
  }

  return <PropertyForm mode="edit" ownerId={userId} existing={property} key={property.id} />
}
