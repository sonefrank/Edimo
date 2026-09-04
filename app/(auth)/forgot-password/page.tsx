'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/components/LanguageProvider'
import { sendPasswordResetEmail } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: resetError } = await sendPasswordResetEmail(email)
      if (resetError) {
        setError(t('auth.sendLinkError'))
        return
      }
      setSent(true)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <MailCheck className="size-7 text-[#D4AF37]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">{t('auth.forgotSentTitle')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('auth.forgotSentBody')} <span className="font-medium text-foreground">{email}</span>,
          {t('auth.forgotSentBodyEnd')}
        </p>
        <Link href="/login" className="text-sm font-medium text-[#D4AF37] hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">{t('auth.forgotTitle')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('auth.forgotSubtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jean.mballa@email.com"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('auth.sendLink')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-[#D4AF37] hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </p>
    </div>
  )
}
