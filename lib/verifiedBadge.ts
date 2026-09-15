import { messageAdmin } from './admin'

export const VERIFIED_BADGE_PRICE_FCFA = 2000

export async function requestVerifiedBadge(
  userId: string,
  messageText: string
): Promise<{ error: string | null }> {
  return messageAdmin(userId, messageText)
}
