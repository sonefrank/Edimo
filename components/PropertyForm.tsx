'use client'

import { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Loader2, ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Coords } from '@/components/LocationPicker'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { PropertyType, PROPERTY_TYPE_LABELS, Property } from '@/lib/types'
import { ACTIVE_CITIES, getCity, CityId } from '@/lib/cities'

const LocationPicker = dynamic(
  () => import('@/components/LocationPicker').then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-gray-100" /> }
)

const AMENITIES = ['Eau', 'Électricité', 'Cuisine', 'Parking', 'Sécurité', 'Meublé', 'Climatisation']
const SINGLE_ROOM_TYPES: PropertyType[] = ['chambre', 'studio']
const MAX_PHOTOS = 8

export function PropertyForm({
  mode,
  ownerId,
  existing,
}: {
  mode: 'create' | 'edit'
  ownerId: string
  existing?: Property
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [city, setCity] = useState<CityId | ''>((existing?.city as CityId) ?? '')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(existing?.property_type ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [price, setPrice] = useState(existing ? String(existing.price_fcfa) : '')
  const [bedrooms, setBedrooms] = useState(existing ? String(existing.bedrooms) : '')
  const [bathrooms, setBathrooms] = useState(existing ? String(existing.bathrooms) : '')
  const [area, setArea] = useState(existing ? String(existing.area_sqm) : '')
  const [location, setLocation] = useState(existing?.location ?? '')
  const [amenities, setAmenities] = useState<string[]>(existing?.amenities ?? [])
  const [coords, setCoords] = useState<Coords | null>(
    existing?.latitude != null && existing?.longitude != null
      ? { lat: existing.latitude, lng: existing.longitude }
      : null
  )
  const [existingImages, setExistingImages] = useState<string[]>(existing?.images ?? [])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [photoItems, setPhotoItems] = useState<{ file: File; preview: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const photoItemsRef = useRef(photoItems)
  photoItemsRef.current = photoItems

  useEffect(() => {
    return () => {
      photoItemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview))
    }
  }, [])

  useEffect(() => {
    if (propertyType && SINGLE_ROOM_TYPES.includes(propertyType)) setBedrooms('1')
  }, [propertyType])

  function toggleAmenity(amenity: string) {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  function handlePhotosSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return

    setPhotoItems((prev) => {
      const room = MAX_PHOTOS - existingImages.length - prev.length
      const accepted = selected.slice(0, Math.max(room, 0))
      const newItems = accepted.map((file) => ({ file, preview: URL.createObjectURL(file) }))
      return [...prev, ...newItems]
    })
  }

  function removePhoto(index: number) {
    setPhotoItems((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadPhotos(): Promise<string[]> {
    const folder = crypto.randomUUID()
    const urls: string[] = []

    for (const [index, { file: photo }] of photoItems.entries()) {
      const extension = photo.name.split('.').pop() || 'jpg'
      const path = `${ownerId}/${folder}/${index}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(path, photo, { contentType: photo.type })

      if (uploadError) {
        throw new Error(t('propertyForm.singlePhotoUploadError'))
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('property-images').getPublicUrl(path)
      urls.push(publicUrl)
    }

    return urls
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!city) {
      setError(t('propertyForm.selectCity'))
      return
    }
    if (!propertyType) {
      setError(t('propertyForm.selectType'))
      return
    }
    if (!coords) {
      setError(t('propertyForm.selectPosition'))
      return
    }
    if (mode === 'create' && !acceptedTerms) {
      setError(t('propertyForm.mustAcceptTerms'))
      return
    }

    setLoading(true)
    try {
      let newImages: string[] = []
      if (photoItems.length > 0) {
        try {
          newImages = await uploadPhotos()
        } catch {
          setError(t('propertyForm.photoUploadError'))
          return
        }
      }
      const images = [...existingImages, ...newImages]

      const payload = {
        title,
        city,
        property_type: propertyType,
        description,
        price_fcfa: Number(price),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area_sqm: Number(area),
        location,
        latitude: coords.lat,
        longitude: coords.lng,
        amenities,
        images,
      }

      if (mode === 'create') {
        const { data, error: insertError } = await supabase
          .from('properties')
          .insert({ ...payload, owner_id: ownerId, status: 'disponible' })
          .select('id')
          .single()

        if (insertError || !data) {
          setError(t('propertyForm.publishError'))
          return
        }
        router.push(`/property/${data.id}`)
      } else {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ ...payload, approved: false })
          .eq('id', existing!.id)

        if (updateError) {
          setError(t('propertyForm.updateError'))
          return
        }
        router.push(`/property/${existing!.id}`)
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const totalPhotos = existingImages.length + photoItems.length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">
        {mode === 'create' ? t('propertyForm.createTitle') : t('propertyForm.editTitle')}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {mode === 'create' ? t('propertyForm.createSubtitle') : t('propertyForm.editSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">{t('propertyForm.city')}</Label>
          <Select value={city} onValueChange={(v) => setCity(v as CityId)}>
            <SelectTrigger id="city" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVE_CITIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {t(`cities.${c.id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('propertyForm.type')}</Label>
          <div className="flex gap-2">
            {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPropertyType(type)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  propertyType === type
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#1a1a1a]'
                    : 'border-gray-200 text-muted-foreground hover:border-gray-300'
                }`}
              >
                {t(`propertyType.${type}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">{t('propertyForm.listingTitle')}</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('propertyForm.titlePlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">{t('propertyForm.description')}</Label>
          <Textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('propertyForm.descriptionPlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">{t('propertyForm.location')}</Label>
          <Input
            id="location"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('propertyForm.locationPlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('propertyForm.exactPosition')}</Label>
          <LocationPicker
            value={coords}
            onChange={setCoords}
            onLocationName={setLocation}
            center={city ? getCity(city)?.center : undefined}
          />
        </div>

        <div
          className={`grid grid-cols-2 gap-4 ${
            propertyType && SINGLE_ROOM_TYPES.includes(propertyType) ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
          }`}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">{t('propertyForm.priceLabel')}</Label>
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
          {!(propertyType && SINGLE_ROOM_TYPES.includes(propertyType)) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bedrooms">{t('propertyForm.bedrooms')}</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                required
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bathrooms">{t('propertyForm.bathrooms')}</Label>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              required
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area">{t('propertyForm.area')}</Label>
            <Input
              id="area"
              type="number"
              min={0}
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="90"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('propertyForm.amenities')}</Label>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {AMENITIES.map((amenity) => (
              <label key={amenity} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={amenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                {t(`amenities.${amenity}`)}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            {t('propertyForm.photos')} ({totalPhotos}/{MAX_PHOTOS})
          </Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingImages.map((src, index) => (
              <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${t('property.photoOf')} ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label={t('propertyForm.removePhoto')}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photoItems.map((item, index) => (
              <div key={item.preview} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt={t('propertyForm.newPhoto')} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label={t('propertyForm.removePhoto')}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {totalPhotos < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-muted-foreground hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                <ImagePlus className="size-5" />
                <span className="text-xs">{t('propertyForm.addPhoto')}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosSelected}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">{t('propertyForm.photoHint')}</p>
        </div>

        {mode === 'create' && (
          <label className="flex items-start gap-2 pt-2 text-sm text-muted-foreground">
            <Checkbox
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            {t('propertyForm.acceptTermsPrefix')}{' '}
            <Link href="/terms" target="_blank" className="text-[#D4AF37] underline hover:text-[#1a1a1a]">
              {t('auth.termsOfService')}
            </Link>{' '}
            {t('propertyForm.acceptTermsSuffix')}
          </label>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'create' ? t('propertyForm.publish') : t('propertyForm.saveChanges')}
        </Button>
      </form>
    </div>
  )
}
