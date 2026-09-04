'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

export function StarRating({
  value,
  onChange,
  size = 'size-4',
}: {
  value: number
  onChange?: (rating: number) => void
  size?: string
}) {
  const [hovered, setHovered] = useState(0)
  const interactive = Boolean(onChange)
  const displayValue = hovered || value

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onMouseEnter={() => interactive && setHovered(star)}
          onClick={() => onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={interactive ? `Donner ${star} étoile(s)` : undefined}
        >
          <Star
            className={`${size} ${
              star <= displayValue ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
