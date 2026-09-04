'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { updatePassword } from '@/lib/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const [validLink, setValidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session) setValidLink(true)
      setReady(true)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setValidLink(true)
        setReady(true)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await updatePassword(password)
      if (updateError) {
        setError(t('auth.updatePasswordError'))
        return
      }
      setSuccess(true)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <CheckCircle2 className="size-7 text-[#D4AF37]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">{t('auth.resetSuccessTitle')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t('auth.resetSuccessBody')}</p>
        <Button onClick={() => router.push('/home')} className="w-full">
          {t('auth.continue')}
        </Button>
      </div>
    )
  }

  if (!validLink) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">{t('auth.invalidLinkTitle')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t('auth.invalidLinkBody')}</p>
        <Link href="/forgot-password" className="text-sm font-medium text-[#D4AF37] hover:underline">
          {t('auth.resetPassword')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">{t('auth.resetTitle')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('auth.resetSubtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('auth.newPassword')}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordHint')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.retypePassword')}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('auth.updatePassword')}
        </Button>
      </form>
    </div>
  )
}
