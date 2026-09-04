'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DisclaimerBanner } from '@/components/DisclaimerBanner'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'

export default function ConversationPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property') ?? undefined
  const { t } = useTranslation()

  const [userId, setUserId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', params.id)
          .maybeSingle()
        if (profile?.full_name) setParticipantName(profile.full_name)

        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${params.id}),and(sender_id.eq.${params.id},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true })

        if (fetchError) {
          setError(t('messages.loadConversationError'))
          return
        }
        setMessages((data as Message[]) ?? [])

        const unreadIds = ((data as Message[]) ?? [])
          .filter((m) => m.receiver_id === user.id && !m.read)
          .map((m) => m.id)
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ read: true }).in('id', unreadIds)
        }
      } catch {
        setError(t('messages.loadConversationError'))
      } finally {
        setLoading(false)
      }
    }
    if (params.id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (!userId || !params.id) return

    const channel = supabase
      .channel(`conversation-${userId}-${params.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new as Message
          const isRelevant =
            (message.sender_id === userId && message.receiver_id === params.id) ||
            (message.sender_id === params.id && message.receiver_id === userId)
          if (isRelevant) {
            setMessages((prev) => [...prev, message])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId) return

    setSending(true)
    try {
      const { error: insertError } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: params.id,
        property_id: propertyId,
        message_text: text.trim(),
        read: false,
      })
      if (!insertError) {
        setText('')
        fetch('/api/push/notify-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: params.id, senderId: userId, propertyId }),
        }).catch(() => {})
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-4 sm:px-6">
      <h1 className="mb-3 text-lg font-semibold text-[#1a1a1a]">
        {participantName || t('messages.defaultUser')}
      </h1>
      <DisclaimerBanner />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="mb-4 flex-1 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('messages.startConversation')}
          </p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === userId
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  isMine
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-gray-100 text-foreground'
                }`}
              >
                {message.message_text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('messages.placeholder')}
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !text.trim()} size="icon">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  )
}
