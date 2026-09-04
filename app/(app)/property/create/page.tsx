'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PropertyForm } from '@/components/PropertyForm'
import { useCurrentUser } from '@/components/UserProvider'
import { useTranslation } from '@/components/LanguageProvider'

export default function CreatePropertyPage() {
  const { userType, id: userId } = useCurrentUser()
  const { t } = useTranslation()

  if (userType !== 'propriétaire') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{t('propertyForm.ownerOnly')}</p>
        <Button asChild variant="outline">
          <Link href="/home">{t('common.backToHome')}</Link>
        </Button>
      </div>
    )
  }

  return <PropertyForm mode="create" ownerId={userId} />
}
