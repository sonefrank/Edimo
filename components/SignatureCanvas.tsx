'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/LanguageProvider'

export function SignatureCanvasInput({
  onSignatureCaptured,
  onClear,
}: {
  onSignatureCaptured: (signature: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isSigned, setIsSigned] = useState(false)
  const [error, setError] = useState('')

  function handleClear() {
    sigCanvas.current?.clear()
    setIsSigned(false)
    setError('')
    onClear()
  }

  function handleSave() {
    setError('')
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setError(t('contract.draw.empty'))
      return
    }
    const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    onSignatureCaptured(signatureData)
    setIsSigned(true)
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-4">
      <h3 className="mb-4 font-bold text-foreground">{t('contract.draw.title')}</h3>

      <SignatureCanvas
        ref={sigCanvas}
        canvasProps={{
          width: 500,
          height: 150,
          className: 'w-full max-w-full border border-gray-300 bg-white cursor-crosshair rounded',
        }}
        backgroundColor="white"
      />

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear}>
          <RotateCcw className="size-4" />
          {t('contract.draw.clear')}
        </Button>
        <Button type="button" onClick={handleSave}>
          <Check className="size-4" />
          {t('contract.draw.validate')}
        </Button>
      </div>

      {isSigned && (
        <p className="mt-2 text-sm font-medium text-green-600">✓ {t('contract.draw.captured')}</p>
      )}
    </div>
  )
}
