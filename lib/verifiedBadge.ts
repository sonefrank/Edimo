import { supabase } from './supabase'

export const VERIFIED_BADGE_PRICE_FCFA = 2000

async function getAdminProfileId(): Promise<string | null> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!adminEmail) return null

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', adminEmail)
    .maybeSingle()

  return data?.id ?? null
}

export async function requestVerifiedBadge(
  userId: string,
  messageText: string
): Promise<{ error: string | null }> {
  const adminId = await getAdminProfileId()
  if (!adminId) return { error: 'admin_not_found' }

  const { error } = await supabase.from('messages').insert({
    sender_id: userId,
    receiver_id: adminId,
    message_text: messageText,
  })

  return { error: error?.message ?? null }
}
