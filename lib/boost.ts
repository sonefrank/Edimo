import { messageAdmin } from './admin'

export const BOOST_PRICE_FCFA = 1000
export const BOOST_DURATION_DAYS = 7

export function isBoosted(boostedUntil: string | null | undefined): boolean {
  return Boolean(boostedUntil && new Date(boostedUntil).getTime() > Date.now())
}

export async function requestBoost(
  userId: string,
  messageText: string
): Promise<{ error: string | null }> {
  return messageAdmin(userId, messageText)
}
