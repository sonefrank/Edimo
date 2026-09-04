import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/sendPush'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const { propertyId } = await request.json()
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId requis' }, { status: 400 })
  }

  const { data: property } = await supabaseAdmin
    .from('properties')
    .select('id, owner_id, title, property_type, price_fcfa, location')
    .eq('id', propertyId)
    .maybeSingle()

  if (!property) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  }

  const { data: searches } = await supabaseAdmin
    .from('saved_searches')
    .select('user_id, property_type, min_budget, max_budget, location_query')

  const matchingUserIds = new Set<string>()
  for (const search of searches ?? []) {
    if (search.user_id === property.owner_id) continue
    if (search.property_type && search.property_type !== property.property_type) continue
    if (search.min_budget != null && property.price_fcfa < search.min_budget) continue
    if (search.max_budget != null && property.price_fcfa > search.max_budget) continue
    if (search.location_query) {
      const query = search.location_query.toLowerCase()
      const haystack = `${property.title} ${property.location}`.toLowerCase()
      if (!haystack.includes(query)) continue
    }
    matchingUserIds.add(search.user_id)
  }

  await Promise.all(
    Array.from(matchingUserIds).map((userId) =>
      sendPushToUser(userId, {
        title: 'Nouvelle annonce qui correspond à votre alerte',
        body: `${property.title} — ${property.location}`,
        url: `/property/${property.id}`,
        tag: `listing-${property.id}`,
      })
    )
  )

  return NextResponse.json({ ok: true, notified: matchingUserIds.size })
}
