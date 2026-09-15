'use client'

import Link from 'next/link'
import { MapPin, BedDouble, Ruler, BadgeCheck, Rocket } from 'lucide-react'
import { useTranslation } from '@/components/LanguageProvider'
import { isBoosted } from '@/lib/boost'
import { Property } from '@/lib/types'

export function PropertyCard({
  property,
  ownerVerified = false,
}: {
  property: Property
  ownerVerified?: boolean
}) {
  const { t, locale } = useTranslation()
  const boosted = isBoosted(property.boosted_until)

  return (
    <Link href={`/property/${property.id}`}>
      <div
        className={`group overflow-hidden border-[3px] arcade-shadow transition-transform hover:-translate-y-1 hover:arcade-shadow ${
          boosted ? 'border-[#FF2E8C] bg-[#1F0F3D]' : 'border-[#0a0417] bg-[#1F0F3D]'
        }`}
      >
        {boosted && (
          <div className="flex items-center justify-center gap-1.5 border-b-[3px] border-[#0a0417] bg-[#FF2E8C] py-1 font-body text-xs font-bold tracking-wide text-[#0a0417] uppercase">
            <Rocket className="size-3.5" />
            {t('property.featured')}
          </div>
        )}
        <div className="relative h-48 w-full border-b-[3px] border-[#0a0417] bg-[#2a1650]">
          {property.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute top-2 left-2 border-2 border-[#0a0417] bg-[#00E5FF] px-2 py-1 font-body text-xs font-semibold tracking-wide text-[#0a0417] uppercase">
            {t(`propertyType.${property.property_type}`)}
          </span>
          {ownerVerified && (
            <span className="absolute top-2 right-2 flex items-center gap-1 border-2 border-[#0a0417] bg-[#39FF6A] px-2 py-1 font-body text-xs font-semibold tracking-wide text-[#0a0417] uppercase">
              <BadgeCheck className="size-3" />
              {t('property.verified')}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="truncate font-display text-base tracking-wide text-[#FFF6E0]">{property.title}</h3>
          <p className="mt-1.5 mb-2 flex items-center gap-1 font-body text-base font-medium text-[#B9A7DE]">
            <MapPin className="size-3.5 shrink-0" /> {property.location}
          </p>
          <p className="mb-3 flex items-center gap-3 font-body text-base font-medium text-[#B9A7DE]">
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" /> {property.bedrooms} {t('property.bedrooms')}
            </span>
            <span className="flex items-center gap-1">
              <Ruler className="size-3.5" /> {property.area_sqm}
              {t('property.area')}
            </span>
          </p>
          <p className="border-2 border-[#0a0417] bg-[#0a0417] px-2.5 py-2 font-display text-base text-[#FFD400]">
            {property.price_fcfa.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
            <span className="text-[#B9A7DE]"> FCFA</span>
            <span className="ml-1 font-body text-sm font-medium text-[#B9A7DE]">/ {t('common.perMonth')}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
