'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/LanguageProvider'

const DOUALA_CENTER: [number, number] = [4.0483, 9.7043]

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="#ffffff"/>
    </svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  })
}

async function reverseGeocode(lat: number, lng: number, language: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': language } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const address = data.address ?? {}
    const area = address.suburb || address.neighbourhood || address.city_district || address.quarter
    const city = address.city || address.town || address.village || address.county
    const parts = [area, city].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : (data.display_name ?? null)
  } catch {
    return null
  }
}

export interface Coords {
  lat: number
  lng: number
}

export function LocationPicker({
  value,
  onChange,
  onLocationName,
  center = DOUALA_CENTER,
}: {
  value: Coords | null
  onChange: (coords: Coords) => void
  onLocationName?: (name: string) => void
  /** Centre par défaut de la carte tant qu'aucun point n'est placé (ex: centre de la ville choisie) */
  center?: [number, number]
}) {
  const { t, locale } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onLocationNameRef = useRef(onLocationName)
  onLocationNameRef.current = onLocationName
  const localeRef = useRef(locale)
  localeRef.current = locale

  const [geoError, setGeoError] = useState('')
  const [locating, setLocating] = useState(false)
  const [resolvingName, setResolvingName] = useState(false)

  function handlePositionChange(lat: number, lng: number) {
    onChangeRef.current({ lat, lng })
    if (!onLocationNameRef.current) return
    setResolvingName(true)
    reverseGeocode(lat, lng, localeRef.current)
      .then((name) => {
        if (name) onLocationNameRef.current?.(name)
      })
      .finally(() => setResolvingName(false))
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView(
      value ? [value.lat, value.lng] : center,
      value ? 16 : 13
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    function placeMarker(lat: number, lng: number) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true, icon: pinIcon('#D4AF37') })
          .addTo(map)
          .on('dragend', () => {
            const pos = markerRef.current!.getLatLng()
            handlePositionChange(pos.lat, pos.lng)
          })
      }
    }

    if (value) placeMarker(value.lat, value.lng)

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
      handlePositionChange(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recentre la carte si la ville choisie change, tant que l'utilisateur n'a pas
  // encore placé de point manuellement.
  useEffect(() => {
    if (!value) mapRef.current?.setView(center, 13)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center])

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError(t('locationPicker.geoUnavailable'))
      return
    }
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        handlePositionChange(latitude, longitude)
        mapRef.current?.setView([latitude, longitude], 16)
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude])
        } else if (mapRef.current) {
          markerRef.current = L.marker([latitude, longitude], {
            draggable: true,
            icon: pinIcon('#D4AF37'),
          })
            .addTo(mapRef.current)
            .on('dragend', () => {
              const pos = markerRef.current!.getLatLng()
              handlePositionChange(pos.lat, pos.lng)
            })
        }
        setLocating(false)
      },
      () => {
        setGeoError(t('locationPicker.geoError'))
        setLocating(false)
      }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t('locationPicker.clickHint')}</p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          <LocateFixed className="size-3.5" />
          {locating ? t('locationPicker.locating') : t('locationPicker.useMyLocation')}
        </Button>
      </div>
      <div
        ref={containerRef}
        className="isolate h-64 w-full overflow-hidden rounded-lg border border-gray-200"
      />
      {geoError && <p className="text-xs text-destructive">{geoError}</p>}
      {value && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {t('locationPicker.selectedPosition')} {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          {resolvingName && <Loader2 className="size-3 animate-spin" />}
        </p>
      )}
    </div>
  )
}
