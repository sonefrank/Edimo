'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MailCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/LanguageProvider'
import { resendVerificationEmail } from '@/lib/auth'

function VerifyContent() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const email = searchParams.get('email') ?? ''
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const { error: resendError } = await resendVerificationEmail(email)
      if (resendError) {
        setError(t('auth.resendError'))
        return
      }
      setSent(true)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
        <MailCheck className="size-7 text-[#D4AF37]" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">{t('auth.verifyTitle')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t('auth.verifyBody')}
        {email ? (
          <>
            {' '}
            <span className="font-medium text-foreground">{email}</span>
          </>
        ) : null}
        {t('auth.verifyBodyEnd')}
      </p>

      {sent && <p className="mb-4 text-sm text-green-600">{t('auth.resendSuccess')}</p>}
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <Button onClick={handleResend} disabled={loading || !email} variant="outline" className="w-full">
        {loading && <Loader2 className="size-4 animate-spin" />}
        {t('auth.resendEmail')}
      </Button>

      <Link href="/login" className="mt-6 text-sm font-medium text-[#D4AF37] hover:underline">
        {t('auth.backToLogin')}
      </Link>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}
