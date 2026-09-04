'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, Trash2, Users, Home, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { PROPERTY_TYPE_LABELS, Property, Review, User } from '@/lib/types'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || (ADMIN_EMAIL && user.email !== ADMIN_EMAIL)) {
        setAuthorized(false)
        router.replace('/home')
        return
      }
      setAuthorized(true)
    }
    checkAccess()
  }, [router])

  useEffect(() => {
    if (!authorized) return

    async function load() {
      setLoading(true)
      const [{ data: usersData }, { data: propertiesData }, { data: reviewsData }] =
        await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('properties').select('*').order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        ])
      setUsers((usersData as User[]) ?? [])
      setProperties((propertiesData as Property[]) ?? [])
      setReviews((reviewsData as Review[]) ?? [])
      setLoading(false)
    }
    load()
  }, [authorized])

  function withPending(id: string, fn: () => Promise<void>) {
    setPendingIds((prev) => new Set(prev).add(id))
    fn().finally(() => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }

  function verifyUser(id: string) {
    withPending(id, async () => {
      await supabase.from('profiles').update({ verified: true }).eq('id', id)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verified: true } : u)))
    })
  }

  function rejectUser(id: string) {
    withPending(id, async () => {
      await supabase.from('profiles').delete().eq('id', id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    })
  }

  function approveProperty(id: string) {
    withPending(id, async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await supabase
        .from('properties')
        .update({ approved: true, expires_at: expiresAt, expiry_notified: false })
        .eq('id', id)
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, approved: true, expires_at: expiresAt } : p))
      )
      fetch('/api/push/notify-new-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      }).catch(() => {})
    })
  }

  function removeProperty(id: string) {
    withPending(id, async () => {
      await supabase.from('properties').delete().eq('id', id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
    })
  }

  function removeReview(id: string) {
    withPending(id, async () => {
      await supabase.from('reviews').delete().eq('id', id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    })
  }

  if (authorized === null || authorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  const pendingUsers = users.filter((u) => !u.verified)
  const pendingProperties = properties.filter((p) => !p.approved)
  const sortedProperties = [...properties].sort(
    (a, b) => Number(a.approved) - Number(b.approved)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a1a1a] px-6 py-5">
        <h1 className="text-xl font-bold text-[#D4AF37]">EDIMO · Administration</h1>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="size-6 text-[#D4AF37]" />
              <div>
                <p className="text-lg font-bold text-[#1a1a1a]">{users.length}</p>
                <p className="text-xs text-muted-foreground">Utilisateurs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Home className="size-6 text-[#D4AF37]" />
              <div>
                <p className="text-lg font-bold text-[#1a1a1a]">{properties.length}</p>
                <p className="text-xs text-muted-foreground">Annonces</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Star className="size-6 text-[#D4AF37]" />
              <div>
                <p className="text-lg font-bold text-[#1a1a1a]">{reviews.length}</p>
                <p className="text-xs text-muted-foreground">Avis</p>
              </div>
            </CardContent>
          </Card>
          <Card className={pendingUsers.length + pendingProperties.length > 0 ? 'border-amber-300' : undefined}>
            <CardContent className="flex items-center gap-3 p-4">
              <Check className="size-6 text-amber-600" />
              <div>
                <p className="text-lg font-bold text-[#1a1a1a]">
                  {pendingUsers.length + pendingProperties.length}
                </p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Utilisateurs ({pendingUsers.length} en attente)</TabsTrigger>
              <TabsTrigger value="properties">Annonces ({pendingProperties.length} en attente)</TabsTrigger>
              <TabsTrigger value="reviews">Avis</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="flex flex-col gap-3">
                {users.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Aucun utilisateur.</p>
                )}
                {users.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{u.full_name}</p>
                        <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                        <Badge variant="secondary" className="mt-1 capitalize">
                          {u.user_type}
                        </Badge>
                        {u.verified && (
                          <Badge className="mt-1 ml-1.5 bg-green-100 text-green-700 hover:bg-green-100">
                            Vérifié
                          </Badge>
                        )}
                      </div>
                      {!u.verified && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            onClick={() => verifyUser(u.id)}
                            disabled={pendingIds.has(u.id)}
                          >
                            <Check className="size-4" /> Vérifier
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectUser(u.id)}
                            disabled={pendingIds.has(u.id)}
                          >
                            <X className="size-4" /> Rejeter
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="properties">
              <div className="flex flex-col gap-3">
                {properties.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Aucune annonce.</p>
                )}
                {sortedProperties.map((p) => (
                  <Card key={p.id} className={!p.approved ? 'border-amber-300' : undefined}>
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{p.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {p.location} · {p.price_fcfa.toLocaleString('fr-FR')} FCFA
                        </p>
                        <Badge variant="secondary" className="mt-1 capitalize">
                          {PROPERTY_TYPE_LABELS[p.property_type]}
                        </Badge>
                        <Badge variant="secondary" className="mt-1 ml-1.5 capitalize">
                          {p.status}
                        </Badge>
                        {p.approved ? (
                          <Badge className="mt-1 ml-1.5 bg-green-100 text-green-700 hover:bg-green-100">
                            Approuvée
                          </Badge>
                        ) : (
                          <Badge className="mt-1 ml-1.5 bg-amber-100 text-amber-800 hover:bg-amber-100">
                            En attente
                          </Badge>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {!p.approved && (
                          <Button
                            size="sm"
                            onClick={() => approveProperty(p.id)}
                            disabled={pendingIds.has(p.id)}
                          >
                            <Check className="size-4" /> Valider
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeProperty(p.id)}
                          disabled={pendingIds.has(p.id)}
                        >
                          <Trash2 className="size-4" /> {p.approved ? 'Supprimer' : 'Rejeter'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="flex flex-col gap-3">
                {reviews.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Aucun avis.</p>
                )}
                {reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{'⭐'.repeat(r.rating)}</p>
                        <p className="truncate text-sm text-muted-foreground">{r.comment}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeReview(r.id)}
                        disabled={pendingIds.has(r.id)}
                      >
                        <Trash2 className="size-4" /> Supprimer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
