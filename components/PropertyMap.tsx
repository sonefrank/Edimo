'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

interface OsrmRoute {
  distanceMeters: number
  durationSeconds: number
  coordinates: [number, number][]
}

async function fetchRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<OsrmRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const route = json.routes?.[0]
    if (!route) return null
    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    }
  } catch {
    return null
  }
}

export function PropertyMap({
  propertyLat,
  propertyLng,
  propertyTitle,
  origin,
}: {
  propertyLat: number
  propertyLng: number
  propertyTitle: string
  origin?: { lat: number; lng: number } | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.Layer | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ km: number; minutes: number } | null>(null)
  const [routeApprox, setRouteApprox] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current).setView([propertyLat, propertyLng], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    L.marker([propertyLat, propertyLng], { icon: pinIcon('#D4AF37') })
      .addTo(map)
      .bindPopup(propertyTitle)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      routeLayerRef.current = null
      originMarkerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyLat, propertyLng, propertyTitle])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !origin) return
    let cancelled = false

    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current)
    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current)

    originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: pinIcon('#1a1a1a') })
      .addTo(map)
      .bindPopup('Votre position')

    fetchRoute(origin, { lat: propertyLat, lng: propertyLng }).then((route) => {
      if (cancelled || !map) return

      if (route) {
        const line = L.polyline(route.coordinates, { color: '#1a1a1a', weight: 4, opacity: 0.8 })
        line.addTo(map)
        routeLayerRef.current = line
        map.fitBounds(line.getBounds(), { padding: [32, 32] })
        setRouteInfo({
          km: route.distanceMeters / 1000,
          minutes: Math.round(route.durationSeconds / 60),
        })
        setRouteApprox(false)
      } else {
        const line = L.polyline(
          [
            [origin.lat, origin.lng],
            [propertyLat, propertyLng],
          ],
          { color: '#1a1a1a', weight: 3, opacity: 0.7, dashArray: '6 8' }
        )
        line.addTo(map)
        routeLayerRef.current = line
        map.fitBounds(line.getBounds(), { padding: [32, 32] })
        setRouteInfo(null)
        setRouteApprox(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [origin, propertyLat, propertyLng])

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="isolate h-72 w-full overflow-hidden rounded-xl border border-gray-200" />
      {routeInfo && (
        <p className="text-sm text-muted-foreground">
          Itinéraire : {routeInfo.km.toFixed(1)} km · environ {routeInfo.minutes} min en voiture
        </p>
      )}
      {routeApprox && (
        <p className="text-xs text-muted-foreground">
          Itinéraire précis indisponible pour le moment — ligne directe affichée à titre indicatif.
        </p>
      )}
    </div>
  )
}
