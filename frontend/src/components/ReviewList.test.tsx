import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Review } from '../types/review'
import ReviewList from './ReviewList'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const review: Review = {
  sk_movie_review_id: 'r1',
  nome: 'Ana',
  nota: 7.5,
  comentario: 'Muito bom',
  created_at: '2026-01-15T12:00:00Z',
}

describe('ReviewList', () => {
  it('shows an empty state when there are no reviews', () => {
    render(<ReviewList reviews={[]} />)

    expect(screen.getByText('Nenhuma avaliação ainda. Seja o primeiro.')).toBeInTheDocument()
  })

  it('renders the reviewer name, score, comment and formatted date', () => {
    render(<ReviewList reviews={[review]} />)

    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('Muito bom')).toBeInTheDocument()
    expect(screen.getByText(dateFormatter.format(new Date(review.created_at)))).toBeInTheDocument()
  })

  it('renders one list item per review', () => {
    const second: Review = { ...review, sk_movie_review_id: 'r2', nome: 'Bruno' }
    render(<ReviewList reviews={[review, second]} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
