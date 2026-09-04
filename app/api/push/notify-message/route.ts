import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/sendPush'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const { receiverId, senderId, propertyId } = await request.json()

  if (!receiverId || !senderId) {
    return NextResponse.json({ error: 'receiverId et senderId requis' }, { status: 400 })
  }

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', senderId)
    .maybeSingle()

  await sendPushToUser(receiverId, {
    title: sender?.full_name ?? 'Nouveau message',
    body: 'Vous avez reçu un nouveau message sur Edimo.',
    url: propertyId ? `/messages/${senderId}?property=${propertyId}` : `/messages/${senderId}`,
    tag: `message-${senderId}`,
  })

  return NextResponse.json({ ok: true })
}
