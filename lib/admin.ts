import { supabase } from './supabase'

export async function getAdminProfileId(): Promise<string | null> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!adminEmail) return null

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', adminEmail)
    .maybeSingle()

  return data?.id ?? null
}

export async function messageAdmin(
  senderId: string,
  messageText: string
): Promise<{ error: string | null }> {
  const adminId = await getAdminProfileId()
  if (!adminId) return { error: 'admin_not_found' }

  const { error } = await supabase.from('messages').insert({
    sender_id: senderId,
    receiver_id: adminId,
    message_text: messageText,
  })

  return { error: error?.message ?? null }
}
