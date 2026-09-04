import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/sendPush'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function runExpiryCheck() {
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expiring } = await supabaseAdmin
    .from('properties')
    .select('id, owner_id, title, expires_at')
    .eq('approved', true)
    .eq('expiry_notified', false)
    .not('expires_at', 'is', null)
    .lte('expires_at', in3Days)

  for (const property of expiring ?? []) {
    await sendPushToUser(property.owner_id, {
      title: 'Votre annonce expire bientôt',
      body: `« ${property.title} » expire dans moins de 3 jours. Renouvelez-la depuis Mes annonces.`,
      url: '/my-properties',
      tag: `expiring-${property.id}`,
    })
    await supabaseAdmin.from('properties').update({ expiry_notified: true }).eq('id', property.id)
  }

  return expiring?.length ?? 0
}

// Appelée automatiquement par Vercel Cron (voir vercel.json) une fois déployé.
// Vercel envoie "Authorization: Bearer $CRON_SECRET" quand CRON_SECRET est défini
// dans les variables d'environnement du projet.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const notified = await runExpiryCheck()
  return NextResponse.json({ ok: true, notified })
}

// Conservée pour un déclenchement manuel (tests locaux avant déploiement).
export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const notified = await runExpiryCheck()
  return NextResponse.json({ ok: true, notified })
}
