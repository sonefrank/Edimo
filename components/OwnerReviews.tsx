'use client'

import { useEffect, useState, FormEvent } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/StarRating'
import { useTranslation } from '@/components/LanguageProvider'
import { supabase } from '@/lib/supabase'
import { ReviewWithReviewer } from '@/lib/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function OwnerReviews({
  ownerId,
  currentUserId,
  canReview,
}: {
  ownerId: string
  currentUserId: string | null
  canReview: boolean
}) {
  const { t, locale } = useTranslation()
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviewer_id(full_name)')
        .eq('reviewed_user_id', ownerId)
        .order('created_at', { ascending: false })
      setReviews((data as ReviewWithReviewer[]) ?? [])
      setLoading(false)
    }
    load()
  }, [ownerId])

  const myReview = currentUserId ? reviews.find((r) => r.reviewer_id === currentUserId) : undefined
  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (rating < 1) {
      setError(t('property.selectRating'))
      return
    }
    if (!comment.trim()) {
      setError(t('property.writeComment'))
      return
    }
    if (!currentUserId) return

    setSubmitting(true)
    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: currentUserId,
          reviewed_user_id: ownerId,
          rating,
          comment: comment.trim(),
        })
        .select('*, reviewer:profiles!reviewer_id(full_name)')
        .single()

      if (insertError || !data) {
        setError(t('property.reviewSaveError'))
        return
      }
      setReviews((prev) => [data as ReviewWithReviewer, ...prev])
      setRating(0)
      setComment('')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteMyReview() {
    if (!myReview) return
    await supabase.from('reviews').delete().eq('id', myReview.id)
    setReviews((prev) => prev.filter((r) => r.id !== myReview.id))
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-semibold text-foreground">{t('property.reviewsTitle')}</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <StarRating value={Math.round(average)} size="size-3.5" />
            {average.toFixed(1)} ({reviews.length})
          </span>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-[#D4AF37]" />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('property.noReviews')}</p>
      )}

      {!loading && reviews.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {initials(review.reviewer?.full_name ?? 'U')}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {review.reviewer?.full_name ?? t('messages.defaultUser')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
              </div>
              <StarRating value={review.rating} size="size-3.5" />
              <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
              {review.reviewer_id === currentUserId && (
                <button
                  type="button"
                  onClick={deleteMyReview}
                  className="mt-2 flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <Trash2 className="size-3" />
                  {t('property.deleteMyReview')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canReview && currentUserId && !myReview && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <p className="text-sm font-medium text-foreground">{t('property.leaveReview')}</p>
          <StarRating value={rating} onChange={setRating} size="size-5" />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('property.reviewPlaceholder')}
            rows={3}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={submitting} className="self-start">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t('property.publishReview')}
          </Button>
        </form>
      )}
    </div>
  )
}
