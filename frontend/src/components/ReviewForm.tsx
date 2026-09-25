import { CircleNotch } from '@phosphor-icons/react'
import { useState } from 'react'

import { ApiError } from '../api/client'
import { createReview } from '../api/movies'
import { pressableClass } from '../styles/motion'
import type { Review } from '../types/review'
import { getReviewerName } from '../utils/reviewerName'
import ScoreInput from './ScoreInput'

interface ReviewFormProps {
  movieId: string
  onCreated: (review: Review) => void
}

function ReviewForm({ movieId, onCreated }: ReviewFormProps) {
  const [nota, setNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (nota === null) {
      setError('Selecione uma nota antes de enviar.')
      return
    }

    setSubmitting(true)

    try {
      const review = await createReview(movieId, {
        nome: getReviewerName() ?? '',
        nota,
        comentario: comentario.trim(),
      })
      onCreated(review)
      setNota(null)
      setComentario('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ScoreInput id="review-nota" value={nota} onChange={setNota} />

      <div className="flex flex-col gap-1">
        <label htmlFor="review-comentario" className="text-sm font-medium text-ink">
          Comentário
        </label>
        <textarea
          id="review-comentario"
          required
          rows={3}
          maxLength={4000}
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex w-fit items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${pressableClass}`}
      >
        {submitting && <CircleNotch size={16} weight="bold" className="animate-spin motion-reduce:animate-none" />}
        {submitting ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </form>
  )
}

export default ReviewForm
