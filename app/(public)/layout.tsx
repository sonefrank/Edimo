'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { PublicNavbar } from '@/components/PublicNavbar'
import { UserProvider, type CurrentUser } from '@/components/UserProvider'
import { supabase } from '@/lib/supabase'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [checked, setChecked] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      if (!session) {
        setChecked(true)
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

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', session.user.id)
        .eq('read', false)
      if (active) setUnreadCount(count ?? 0)

      setChecked(true)
    }
    init()

    return () => {
      active = false
    }
  }, [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[#FFD400] border-t-transparent" />
      </div>
    )
  }

  if (currentUser) {
    return (
      <UserProvider value={currentUser}>
        <div className="flex min-h-screen flex-col">
          <Navbar unreadCount={unreadCount} />
          <main className="flex-1 bg-background">{children}</main>
        </div>
      </UserProvider>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1 bg-background">{children}</main>
    </div>
  )
}
