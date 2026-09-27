import { Star, Trash } from '@phosphor-icons/react'
import { useState } from 'react'

import { ApiError } from '../api/client'
import { deleteReview } from '../api/movies'
import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import type { Review } from '../types/review'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function formatReviewDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

interface ReviewListProps {
  movieId: string
  reviews: Review[]
  onDeleted: (review: Review) => void
}

function ReviewList({ movieId, reviews, onDeleted }: ReviewListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [failedDelete, setFailedDelete] = useState<{ id: string; message: string } | null>(null)

  async function handleDelete(review: Review) {
    if (!window.confirm('Remover esta avaliação? Essa ação não pode ser desfeita.')) return

    setDeletingId(review.sk_movie_review_id)
    setFailedDelete(null)
    try {
      await deleteReview(movieId, review.sk_movie_review_id)
      onDeleted(review)
    } catch (err) {
      setFailedDelete({
        id: review.sk_movie_review_id,
        message: err instanceof ApiError ? err.message : 'Erro ao remover avaliação.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhuma avaliação ainda. Seja o primeiro.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.sk_movie_review_id} className="flex flex-col gap-1 py-4 first:pt-0">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-ink">{review.nome}</span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-medium text-ink">
                <Star size={14} weight="fill" className="text-accent" />
                {review.nota.toFixed(1)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(review)}
                disabled={deletingId === review.sk_movie_review_id}
                aria-label={`Remover avaliação de ${review.nome}`}
                className={`rounded-md p-1 text-ink-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 ${pressableClass} ${focusRingClass}`}
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          </div>
          <p className="text-sm text-ink-muted">{review.comentario}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-ink-muted">{formatReviewDate(review.created_at)}</span>
            {failedDelete?.id === review.sk_movie_review_id && (
              <span className="text-xs text-destructive">{failedDelete.message}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ReviewList
