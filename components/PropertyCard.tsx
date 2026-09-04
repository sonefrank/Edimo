'use client'

import Link from 'next/link'
import { MapPin, BedDouble, Ruler, BadgeCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/components/LanguageProvider'
import { Property } from '@/lib/types'

export function PropertyCard({
  property,
  ownerVerified = false,
}: {
  property: Property
  ownerVerified?: boolean
}) {
  const { t, locale } = useTranslation()

  return (
    <Link href={`/property/${property.id}`}>
      <Card className="overflow-hidden py-0 gap-0 hover:shadow-lg transition cursor-pointer">
        <div className="relative h-48 w-full bg-gray-300">
          {property.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          )}
          <Badge className="absolute top-2 left-2 bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]">
            {t(`propertyType.${property.property_type}`)}
          </Badge>
          {ownerVerified && (
            <Badge className="absolute top-2 right-2 gap-1 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#D4AF37]">
              <BadgeCheck className="size-3" />
              {t('property.verified')}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground truncate">{property.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="size-3.5" /> {property.location}
          </p>
          <p className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" /> {property.bedrooms} {t('property.bedrooms')}
            </span>
            <span className="flex items-center gap-1">
              <Ruler className="size-3.5" /> {property.area_sqm}
              {t('property.area')}
            </span>
          </p>
          <p className="text-lg font-bold text-[#D4AF37]">
            {property.price_fcfa.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} FCFA
            <span className="text-xs font-normal text-muted-foreground"> {t('common.perMonth')}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
