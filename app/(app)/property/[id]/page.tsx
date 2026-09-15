'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import {
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Expand,
  Navigation,
  BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DisclaimerBanner } from '@/components/DisclaimerBanner'
import { OwnerReviews } from '@/components/OwnerReviews'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { Property } from '@/lib/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const PropertyMap = dynamic(
  () => import('@/components/PropertyMap').then((m) => m.PropertyMap),
  { ssr: false, loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-muted" /> }
)

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { t, locale } = useTranslation()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [locatingOrigin, setLocatingOrigin] = useState(false)
  const [originError, setOriginError] = useState('')
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string; verified: boolean } | null>(
    null
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUserId(user?.id ?? null)

        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', params.id)
          .single()

        if (fetchError || !data) {
          setError(t('property.notFound'))
          return
        }
        setProperty(data as Property)

        const { data: owner } = await supabase
          .from('profiles')
          .select('full_name, verified')
          .eq('id', data.owner_id)
          .maybeSingle()
        setOwnerProfile(owner)

        if (user) {
          const { data: favorite } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('property_id', params.id)
            .maybeSingle()
          setIsFavorite(Boolean(favorite))
        }
      } catch {
        setError(t('property.loadError'))
      } finally {
        setLoading(false)
      }
    }
    if (params.id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function toggleFavorite() {
    if (!userId || !property) return
    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', property.id)
        setIsFavorite(false)
      } else {
        await supabase.from('favorites').insert({ user_id: userId, property_id: property.id })
        setIsFavorite(true)
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  function contactOwner() {
    if (!property) return
    router.push(`/messages/${property.owner_id}?property=${property.id}`)
  }

  function showItinerary() {
    if (!('geolocation' in navigator)) {
      setOriginError(t('property.geoUnavailable'))
      return
    }
    setLocatingOrigin(true)
    setOriginError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocatingOrigin(false)
      },
      () => {
        setOriginError(t('property.geoError'))
        setLocatingOrigin(false)
      }
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#150826] py-24">
        <Loader2 className="size-6 animate-spin text-[#FFD400]" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#150826]">
        <p className="mx-auto max-w-3xl px-4 py-16 text-center font-body text-lg text-[#B9A7DE]">
          {error || t('property.notFound')}
        </p>
      </div>
    )
  }

  const images = property.images?.length ? property.images : []
  const isOwner = userId !== null && userId === property.owner_id

  return (
    <div className="min-h-screen bg-[#150826]">
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="relative mb-3 h-64 w-full overflow-hidden border-[3px] border-[#0a0417] bg-[#2a1650] arcade-shadow sm:h-96">
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group block h-full w-full cursor-zoom-in"
            aria-label={t('property.enlargePhoto')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imageIndex]}
              alt={`${property.title} — ${t('property.photoOf')} ${imageIndex + 1}`}
              className="h-full w-full object-cover"
            />
            <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
              <Expand className="size-3.5" />
              {t('property.enlargePhoto')}
            </span>
          </button>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute top-1/2 left-3 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 hover:bg-white"
              aria-label={t('property.previousPhoto')}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setImageIndex((i) => (i + 1) % images.length)}
              className="absolute top-1/2 right-3 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 hover:bg-white"
              aria-label={t('property.nextPhoto')}
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
              {imageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setImageIndex(index)}
              className={`size-14 shrink-0 overflow-hidden border-2 transition ${
                index === imageIndex ? 'border-[#FFD400]' : 'border-[#0a0417] opacity-70 hover:opacity-100'
              }`}
              aria-label={`${t('property.photoOf')} ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-4xl"
          onKeyDown={(e) => {
            if (images.length < 2) return
            if (e.key === 'ArrowLeft') setImageIndex((i) => (i - 1 + images.length) % images.length)
            if (e.key === 'ArrowRight') setImageIndex((i) => (i + 1) % images.length)
          }}
        >
          <DialogTitle className="sr-only">
            {property.title} — {t('property.photoOf')} {imageIndex + 1} {t('common.of')} {images.length}
          </DialogTitle>
          <div className="relative flex max-h-[85vh] items-center justify-center">
            {images.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[imageIndex]}
                alt={`${property.title} — ${t('property.photoOf')} ${imageIndex + 1}`}
                className="max-h-[85vh] w-auto rounded-lg object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:top-2 sm:right-2"
              aria-label={t('common.close')}
            >
              ✕
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 hover:bg-white"
                  aria-label={t('property.previousPhoto')}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                  className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 hover:bg-white"
                  aria-label={t('property.nextPhoto')}
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                  {imageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <span className="border-2 border-[#0a0417] bg-[#00E5FF] px-2 py-1 font-body text-xs font-semibold tracking-wide text-[#0a0417] uppercase">
              {t(`propertyType.${property.property_type}`)}
            </span>
            {isOwner && !property.approved && (
              <span className="border-2 border-[#0a0417] bg-[#FFD400] px-2 py-1 font-body text-xs font-semibold tracking-wide text-[#0a0417] uppercase">
                {t('property.pendingApproval')}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl tracking-wide text-[#FFF6E0]">{property.title}</h1>
          <p className="mt-2 flex items-center gap-1 font-body text-lg font-medium text-[#B9A7DE]">
            <MapPin className="size-4 shrink-0" /> {property.location}
          </p>
        </div>
        {!isOwner && (
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            aria-label={t('property.addToFavorites')}
            className="flex size-10 shrink-0 items-center justify-center border-2 border-[#0a0417] bg-[#1F0F3D] arcade-shadow-sm arcade-press"
          >
            <Heart className={isFavorite ? 'size-4 fill-[#FF2E8C] text-[#FF2E8C]' : 'size-4 text-[#B9A7DE]'} />
          </button>
        )}
      </div>

      <p className="mb-6 border-2 border-[#0a0417] bg-[#0a0417] px-3 py-2.5 font-display text-xl text-[#FFD400]">
        {property.price_fcfa.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
        <span className="text-[#B9A7DE]"> FCFA</span>
        <span className="ml-1 font-body text-base font-medium text-[#B9A7DE]"> {t('common.perMonth')}</span>
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3 border-2 border-[#0a0417] bg-[#1F0F3D] p-4 text-center arcade-shadow-sm">
        <div>
          <BedDouble className="mx-auto mb-1 size-5 text-[#FFD400]" />
          <p className="font-body text-base font-medium text-[#FFF6E0]">
            {property.bedrooms} {t('property.bedroomsFull')}
          </p>
        </div>
        <div>
          <Bath className="mx-auto mb-1 size-5 text-[#FFD400]" />
          <p className="font-body text-base font-medium text-[#FFF6E0]">
            {property.bathrooms} {t('property.bathrooms')}
          </p>
        </div>
        <div>
          <Ruler className="mx-auto mb-1 size-5 text-[#FFD400]" />
          <p className="font-body text-base font-medium text-[#FFF6E0]">
            {property.area_sqm} {t('property.area')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 font-body text-sm font-bold tracking-wide text-[#00E5FF] uppercase">
          {t('property.description')}
        </h2>
        <p className="whitespace-pre-line font-body text-lg font-medium text-[#B9A7DE]">
          {property.description}
        </p>
      </div>

      {property.amenities?.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-body text-sm font-bold tracking-wide text-[#00E5FF] uppercase">
            {t('property.amenities')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((amenity) => (
              <span
                key={amenity}
                className="border-2 border-[#0a0417] bg-[#2a1650] px-2 py-1 font-body text-base font-medium text-[#FFF6E0]"
              >
                {t(`amenities.${amenity}`)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-2 font-body text-sm font-bold tracking-wide text-[#00E5FF] uppercase">
          {t('property.location')}
        </h2>
        {property.latitude != null && property.longitude != null ? (
          <div className="flex flex-col gap-3">
            <PropertyMap
              propertyLat={property.latitude}
              propertyLng={property.longitude}
              propertyTitle={property.title}
              origin={origin}
            />
            {!isOwner && !origin && (
              <div className="flex flex-col items-start gap-2">
                <Button
                  type="button"
                  onClick={showItinerary}
                  disabled={locatingOrigin}
                  className="border-2 border-[#0a0417] bg-[#2a1650] font-body text-sm font-bold tracking-wide text-[#FFF6E0] uppercase arcade-shadow-sm arcade-press hover:bg-[#2a1650]"
                >
                  <Navigation className="size-3.5" />
                  {locatingOrigin ? t('property.locating') : t('property.showItinerary')}
                </Button>
                {originError && <p className="font-body text-base font-medium text-[#FF3B3B]">{originError}</p>}
              </div>
            )}
          </div>
        ) : (
          <p className="font-body text-base font-medium text-[#B9A7DE]">{t('property.noLocation')}</p>
        )}
      </div>

      <OwnerReviews ownerId={property.owner_id} currentUserId={userId} canReview={!isOwner} />

      {isOwner ? (
        <div className="flex flex-col items-center gap-2 border-2 border-[#0a0417] bg-[#1F0F3D] p-4 text-center font-body text-lg font-medium text-[#B9A7DE] arcade-shadow-sm sm:flex-row sm:justify-center">
          {t('property.thisIsYourListing')}
          <div className="flex gap-3">
            <Button asChild variant="link" className="h-auto p-0 font-body text-lg font-semibold text-[#FFD400]">
              <Link href={`/property/${property.id}/edit`}>
                <Pencil className="size-3.5" />
                {t('common.edit')}
              </Link>
            </Button>
            <Button asChild variant="link" className="h-auto p-0 font-body text-lg font-semibold text-[#FFD400]">
              <Link href="/my-properties">{t('property.manageMyListings')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {ownerProfile && (
            <Link
              href={`/profile/${property.owner_id}`}
              className="mb-4 flex items-center gap-3 border-2 border-[#0a0417] bg-[#1F0F3D] p-4 arcade-shadow-sm hover:bg-[#2a1650]"
            >
              <Avatar className="border-2 border-[#0a0417]">
                <AvatarFallback className="bg-[#00E5FF] text-[#0a0417]">
                  {initials(ownerProfile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-body text-lg font-semibold text-[#FFF6E0]">{ownerProfile.full_name}</p>
                  {ownerProfile.verified && (
                    <BadgeCheck className="size-4 shrink-0 text-[#FFD400]" aria-label={t('property.verifiedOwner')} />
                  )}
                </div>
                <p className="font-body text-base font-medium text-[#B9A7DE]">
                  {ownerProfile.verified ? t('property.verifiedOwner') : t('property.ownerLabel')} ·{' '}
                  {t('property.viewProfile')}
                </p>
              </div>
            </Link>
          )}
          <DisclaimerBanner />
          <Button
            onClick={contactOwner}
            className="w-full border-2 border-[#0a0417] bg-[#39FF6A] font-body text-sm font-bold tracking-wide text-[#0a0417] uppercase arcade-shadow-sm arcade-press hover:bg-[#39FF6A]"
          >
            <MessageCircle className="size-4" />
            {t('property.contactOwner')}
          </Button>
        </>
      )}
    </div>
    </div>
  )
}
