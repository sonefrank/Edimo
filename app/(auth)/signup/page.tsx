'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/components/LanguageProvider'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'propriétaire' | 'locataire' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }
    if (!userType) {
      setError(t('auth.selectProfileError'))
      return
    }

    setLoading(true)
    try {
      const { error: signUpError } = await signUp(email, password, fullName, phone, userType)
      if (signUpError) {
        console.error('Erreur signUp Supabase:', signUpError)
        setError(
          signUpError.message === 'User already registered'
            ? t('auth.accountExists')
            : `Error: ${signUpError.message}`
        )
        return
      }
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch (err) {
      console.error('Exception signUp:', err)
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">{t('auth.signupTitle')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('auth.signupSubtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">{t('auth.fullName')}</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jean Mballa"
          />
        </div>

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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t('auth.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
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
          <Label htmlFor="userType">{t('auth.iAm')}</Label>
          <Select
            value={userType}
            onValueChange={(v) => setUserType(v as 'propriétaire' | 'locataire')}
          >
            <SelectTrigger id="userType" className="w-full">
              <SelectValue placeholder={t('auth.selectProfile')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="propriétaire">{t('auth.owner')}</SelectItem>
              <SelectItem value="locataire">{t('auth.tenant')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t('auth.signUp')}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t('auth.acceptTerms')}{' '}
        <Link href="/terms" className="underline hover:text-foreground">
          {t('auth.termsOfService')}
        </Link>{' '}
        {t('auth.and')}{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          {t('auth.privacyPolicy')}
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('auth.alreadyAccount')}{' '}
        <Link href="/login" className="font-medium text-[#D4AF37] hover:underline">
          {t('auth.logIn')}
        </Link>
      </p>
    </div>
  )
}
