'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { UserProvider, type CurrentUser } from '@/components/UserProvider'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, verified')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!active) return
      setCurrentUser({
        id: session.user.id,
        fullName: profile?.full_name ?? session.user.user_metadata?.full_name ?? 'Utilisateur',
        userType: profile?.user_type ?? session.user.user_metadata?.user_type ?? 'locataire',
        verified: profile?.verified ?? false,
      })
    }
    init()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    let active = true

    async function refreshUnreadCount() {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', currentUser!.id)
        .eq('read', false)
      if (active) setUnreadCount(count ?? 0)
    }
    refreshUnreadCount()

    const channel = supabase
      .channel(`unread-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as Message | undefined
          if (row?.receiver_id === currentUser.id) refreshUnreadCount()
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      </div>
    )
  }

  return (
    <UserProvider value={currentUser}>
      <div className="flex min-h-screen flex-col">
        <Navbar unreadCount={unreadCount} />
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </UserProvider>
  )
}
