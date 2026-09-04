'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { Conversation, Message } from '@/lib/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function MessagesPage() {
  const { t, locale } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function formatTime(iso: string) {
    return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: messages, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (fetchError) {
          setError(t('messages.loadError'))
          return
        }

        const byParticipant = new Map<string, Message[]>()
        for (const message of (messages as Message[]) ?? []) {
          const participantId =
            message.sender_id === user.id ? message.receiver_id : message.sender_id
          const list = byParticipant.get(participantId) ?? []
          list.push(message)
          byParticipant.set(participantId, list)
        }

        const participantIds = Array.from(byParticipant.keys())
        const { data: profiles } = participantIds.length
          ? await supabase.from('profiles').select('id, full_name').in('id', participantIds)
          : { data: [] as { id: string; full_name: string }[] }

        const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

        const list: Conversation[] = participantIds.map((id) => {
          const msgs = byParticipant.get(id)!
          const last = msgs[0]
          const unread = msgs.filter((m) => m.receiver_id === user.id && !m.read).length
          return {
            participant_id: id,
            participant_name: nameById.get(id) ?? t('messages.defaultUser'),
            property_id: last.property_id,
            last_message: last.message_text,
            last_message_at: last.created_at,
            unread_count: unread,
          }
        })

        setConversations(list)
      } catch {
        setError(t('messages.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[#1a1a1a]">{t('messages.title')}</h1>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && conversations.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-muted-foreground">
          {t('messages.empty')}
        </div>
      )}

      {!loading && !error && conversations.length > 0 && (
        <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {conversations.map((conversation) => (
            <Link
              key={conversation.participant_id}
              href={`/messages/${conversation.participant_id}${
                conversation.property_id ? `?property=${conversation.property_id}` : ''
              }`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50"
            >
              <Avatar>
                <AvatarFallback>{initials(conversation.participant_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-foreground">
                    {conversation.participant_name}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {conversation.last_message}
                </p>
              </div>
              {conversation.unread_count > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-medium text-[#1a1a1a]">
                  {conversation.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
