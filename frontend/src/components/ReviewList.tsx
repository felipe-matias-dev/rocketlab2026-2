import { Star } from '@phosphor-icons/react'

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
  reviews: Review[]
}

function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhuma avaliação ainda. Seja o primeiro.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.sk_movie_review_id} className="flex flex-col gap-1 py-4 first:pt-0">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-ink">{review.nome}</span>
            <span className="flex shrink-0 items-center gap-1 text-sm text-accent">
              <Star size={14} weight="fill" />
              {review.nota.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-ink-muted">{review.comentario}</p>
          <span className="text-xs text-ink-muted">{formatReviewDate(review.created_at)}</span>
        </li>
      ))}
    </ul>
  )
}

export default ReviewList
