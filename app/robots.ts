import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/property/', '/terms', '/privacy', '/login', '/signup'],
      disallow: [
        '/admin',
        '/api/',
        '/my-properties',
        '/messages',
        '/favorites',
        '/alerts',
        '/profile',
        '/contract',
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
