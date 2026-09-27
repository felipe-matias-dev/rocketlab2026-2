import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { deleteReview } from '../api/movies'
import type { Review } from '../types/review'
import ReviewList from './ReviewList'

vi.mock('../api/movies', () => ({
  deleteReview: vi.fn(),
}))

const mockedDeleteReview = vi.mocked(deleteReview)

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

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReviewList', () => {
  it('shows an empty state when there are no reviews', () => {
    render(<ReviewList movieId="m1" reviews={[]} onDeleted={vi.fn()} />)

    expect(screen.getByText('Nenhuma avaliação ainda. Seja o primeiro.')).toBeInTheDocument()
  })

  it('renders the reviewer name, score, comment and formatted date', () => {
    render(<ReviewList movieId="m1" reviews={[review]} onDeleted={vi.fn()} />)

    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('Muito bom')).toBeInTheDocument()
    expect(screen.getByText(dateFormatter.format(new Date(review.created_at)))).toBeInTheDocument()
  })

  it('renders one list item per review', () => {
    const second: Review = { ...review, sk_movie_review_id: 'r2', nome: 'Bruno' }
    render(<ReviewList movieId="m1" reviews={[review, second]} onDeleted={vi.fn()} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  describe('deleting a review', () => {
    it('does nothing when the confirmation is dismissed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const onDeleted = vi.fn()
      render(<ReviewList movieId="m1" reviews={[review]} onDeleted={onDeleted} />)

      fireEvent.click(screen.getByRole('button', { name: 'Remover avaliação de Ana' }))

      expect(mockedDeleteReview).not.toHaveBeenCalled()
      expect(onDeleted).not.toHaveBeenCalled()
    })

    it('calls the API, notifies the parent and disables the button while pending', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteReview.mockReturnValue(new Promise(() => {}))
      const onDeleted = vi.fn()
      render(<ReviewList movieId="m1" reviews={[review]} onDeleted={onDeleted} />)

      const button = screen.getByRole('button', { name: 'Remover avaliação de Ana' })
      fireEvent.click(button)

      expect(mockedDeleteReview).toHaveBeenCalledWith('m1', 'r1')
      await waitFor(() => expect(button).toBeDisabled())
      expect(onDeleted).not.toHaveBeenCalled()
    })

    it('notifies the parent with the deleted review on success', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteReview.mockResolvedValue(undefined)
      const onDeleted = vi.fn()
      render(<ReviewList movieId="m1" reviews={[review]} onDeleted={onDeleted} />)

      fireEvent.click(screen.getByRole('button', { name: 'Remover avaliação de Ana' }))

      await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(review))
    })

    it('shows the API error message next to the review and does not notify the parent', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteReview.mockRejectedValue(new ApiError(404, 'Avaliação não encontrada'))
      const onDeleted = vi.fn()
      render(<ReviewList movieId="m1" reviews={[review]} onDeleted={onDeleted} />)

      fireEvent.click(screen.getByRole('button', { name: 'Remover avaliação de Ana' }))

      expect(await screen.findByText('Avaliação não encontrada')).toBeInTheDocument()
      expect(onDeleted).not.toHaveBeenCalled()
    })

    it('falls back to a generic error message for a non-API failure', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteReview.mockRejectedValue(new Error('boom'))
      render(<ReviewList movieId="m1" reviews={[review]} onDeleted={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Remover avaliação de Ana' }))

      expect(await screen.findByText('Erro ao remover avaliação.')).toBeInTheDocument()
    })
  })
})
