import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getSiteUrl } from '@/lib/siteUrl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/signup`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
  ]

  const { data: properties } = await supabase
    .from('properties')
    .select('id, created_at')
    .eq('approved', true)
    .eq('status', 'disponible')
    .order('created_at', { ascending: false })

  const propertyPages: MetadataRoute.Sitemap = (properties ?? []).map((property) => ({
    url: `${siteUrl}/property/${property.id}`,
    lastModified: property.created_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...propertyPages]
}
