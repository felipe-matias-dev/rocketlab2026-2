import { useState } from 'react'

import { ApiError } from '../api/client'
import { createReview } from '../api/movies'
import type { Review } from '../types/review'
import ScoreInput from './ScoreInput'

interface ReviewFormProps {
  movieId: string
  onCreated: (review: Review) => void
}

function ReviewForm({ movieId, onCreated }: ReviewFormProps) {
  const [nome, setNome] = useState('')
  const [nota, setNota] = useState('')
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const review = await createReview(movieId, {
        nome: nome.trim(),
        nota: Number(nota),
        comentario: comentario.trim(),
      })
      onCreated(review)
      setNome('')
      setNota('')
      setComentario('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="review-nome" className="text-sm font-medium text-ink">
          Nome
        </label>
        <input
          id="review-nome"
          type="text"
          required
          maxLength={120}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
        />
      </div>

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
        className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </form>
  )
}

export default ReviewForm
