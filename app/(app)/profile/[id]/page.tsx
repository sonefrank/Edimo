'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2, BadgeCheck, CalendarDays } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/PropertyCard'
import { OwnerReviews } from '@/components/OwnerReviews'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { Property } from '@/lib/types'

interface PublicProfile {
  id: string
  full_name: string
  user_type: 'propriétaire' | 'locataire'
  verified: boolean
  bio?: string
  avatar_url?: string
  created_at: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>()
  const { id: currentUserId } = useCurrentUser()
  const { t, locale } = useTranslation()

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, user_type, verified, bio, avatar_url, created_at')
          .eq('id', params.id)
          .maybeSingle()

        if (fetchError || !data) {
          setError(t('profile.notFound'))
          return
        }
        setProfile(data as PublicProfile)

        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', params.id)
          .eq('approved', true)
          .order('created_at', { ascending: false })
        setProperties((propertiesData as Property[]) ?? [])
      } catch {
        setError(t('property.loadError'))
      } finally {
        setLoading(false)
      }
    }
    if (params.id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{error || t('profile.notFound')}</p>
      </div>
    )
  }

  const isOwnProfile = currentUserId === profile.id

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 text-center">
        <Avatar size="lg" className="mx-auto mb-4 size-20">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
          <AvatarFallback className="text-xl">{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-bold text-[#1a1a1a]">{profile.full_name}</h1>
          {profile.verified && <BadgeCheck className="size-5 text-[#D4AF37]" />}
        </div>
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <Badge variant="secondary">
            {profile.user_type === 'propriétaire' ? t('auth.owner') : t('auth.tenant')}
          </Badge>
          {profile.verified && (
            <Badge className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#D4AF37]">
              {t('profile.verifiedByEdimo')}
            </Badge>
          )}
        </div>
        {profile.bio && <p className="mx-auto mb-3 max-w-md text-sm text-muted-foreground">{profile.bio}</p>}
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {t('profile.memberSince')}{' '}
          {new Date(profile.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
        {isOwnProfile && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t('profile.thisIsYourPublicProfile')}{' '}
            <Link href="/profile" className="font-medium text-[#D4AF37] hover:underline">
              {t('profile.manageMyProfile')}
            </Link>
          </p>
        )}
      </div>

      {profile.user_type === 'propriétaire' && (
        <div className="mb-6">
          <h2 className="mb-3 font-semibold text-foreground">
            {t('profile.listings')} ({properties.length})
          </h2>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('profile.noListings')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} ownerVerified={profile.verified} />
              ))}
            </div>
          )}
        </div>
      )}

      <OwnerReviews ownerId={profile.id} currentUserId={currentUserId} canReview={!isOwnProfile} />
    </div>
  )
}
