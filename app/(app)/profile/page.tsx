'use client'

import { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, Phone, Mail, BadgeCheck, Pencil, Camera } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { User } from '@/lib/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [stats, setStats] = useState({ favorites: 0, conversations: 0, reviews: 0 })

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        const loaded: User = {
          id: user.id,
          email: user.email ?? '',
          full_name: profileData?.full_name ?? user.user_metadata?.full_name ?? t('messages.defaultUser'),
          phone: profileData?.phone ?? user.user_metadata?.phone,
          user_type: profileData?.user_type ?? user.user_metadata?.user_type ?? 'locataire',
          verified: Boolean(user.email_confirmed_at),
          bio: profileData?.bio,
          avatar_url: profileData?.avatar_url,
          created_at: user.created_at,
        }
        setProfile(loaded)
        setFullName(loaded.full_name)
        setPhone(loaded.phone ?? '')
        setBio(loaded.bio ?? '')

        const [{ count: favoritesCount }, { data: messages }, { count: reviewsCount }] =
          await Promise.all([
            supabase
              .from('favorites')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id),
            supabase
              .from('messages')
              .select('sender_id, receiver_id')
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
            supabase
              .from('reviews')
              .select('id', { count: 'exact', head: true })
              .eq('reviewed_user_id', user.id),
          ])

        const conversationPartners = new Set(
          (messages ?? []).map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id))
        )

        setStats({
          favorites: favoritesCount ?? 0,
          conversations: conversationPartners.size,
          reviews: reviewsCount ?? 0,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  function handleAvatarSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function startEditing() {
    if (!profile) return
    setFullName(profile.full_name)
    setPhone(profile.phone ?? '')
    setBio(profile.bio ?? '')
    setAvatarFile(null)
    setAvatarPreview('')
    setError('')
    setEditing(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError('')
    setSaving(true)
    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const extension = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${profile.id}/avatar.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

        if (uploadError) {
          setError(t('profile.photoUploadError'))
          return
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = `${publicUrl}?t=${Date.now()}`
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id)

      if (updateError) {
        setError(t('profile.updateError'))
        return
      }

      setProfile({ ...profile, full_name: fullName.trim(), phone: phone.trim(), bio: bio.trim(), avatar_url: avatarUrl })
      setEditing(false)
    } catch {
      setError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    router.push('/login')
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-[#1a1a1a]">{t('profile.editTitle')}</h1>
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative"
              aria-label={t('profile.changePhoto')}
            >
              <Avatar size="lg" className="size-20">
                {(avatarPreview || profile.avatar_url) && (
                  <AvatarImage src={avatarPreview || profile.avatar_url} alt={profile.full_name} />
                )}
                <AvatarFallback className="text-xl">{initials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                <Camera className="size-5" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelected}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">{t('auth.fullName')}</Label>
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">{t('auth.phone')}</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">{t('profile.bio')}</Label>
            <Textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <div className="relative mx-auto mb-4 w-fit">
          <Avatar size="lg" className="size-20">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
            <AvatarFallback className="text-xl">{initials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={startEditing}
            className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/80"
            aria-label={t('profile.editTitle')}
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-bold text-[#1a1a1a]">{profile.full_name}</h1>
          {profile.verified && <BadgeCheck className="size-5 text-[#D4AF37]" />}
        </div>
        <Badge variant="secondary" className="mb-4">
          {profile.user_type === 'propriétaire' ? t('auth.owner') : t('auth.tenant')}
        </Badge>

        {profile.bio && <p className="mb-4 text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mb-6 flex flex-col gap-2 text-left text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="size-4" /> {profile.email}
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4" /> {profile.phone}
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-3 divide-x divide-gray-200 rounded-lg border border-gray-200">
          <div className="p-3">
            <p className="text-lg font-bold text-[#1a1a1a]">{stats.favorites}</p>
            <p className="text-xs text-muted-foreground">{t('profile.favorites')}</p>
          </div>
          <div className="p-3">
            <p className="text-lg font-bold text-[#1a1a1a]">{stats.conversations}</p>
            <p className="text-xs text-muted-foreground">{t('profile.messages')}</p>
          </div>
          <div className="p-3">
            <p className="text-lg font-bold text-[#1a1a1a]">{stats.reviews}</p>
            <p className="text-xs text-muted-foreground">{t('profile.reviews')}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={startEditing}>
            <Pencil className="size-4" />
            {t('profile.editButton')}
          </Button>
          <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="flex-1">
            {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            {t('profile.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}
