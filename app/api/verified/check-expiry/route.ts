import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function runExpiryCheck() {
  const now = new Date().toISOString()

  const { data: expired } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('verified', true)
    .not('verified_until', 'is', null)
    .lt('verified_until', now)

  for (const profile of expired ?? []) {
    await supabaseAdmin.from('profiles').update({ verified: false }).eq('id', profile.id)
  }

  return expired?.length ?? 0
}

// Appelée automatiquement par Vercel Cron (voir vercel.json) une fois déployé.
// Vercel envoie "Authorization: Bearer $CRON_SECRET" quand CRON_SECRET est défini
// dans les variables d'environnement du projet.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const expiredCount = await runExpiryCheck()
  return NextResponse.json({ ok: true, expiredCount })
}

// Conservée pour un déclenchement manuel (tests locaux avant déploiement).
export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const expiredCount = await runExpiryCheck()
  return NextResponse.json({ ok: true, expiredCount })
}
