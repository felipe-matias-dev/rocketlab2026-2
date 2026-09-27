import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { createReview } from '../api/movies'
import type { Review } from '../types/review'
import { getReviewerName } from '../utils/reviewerName'
import ReviewForm from './ReviewForm'

vi.mock('../api/movies', () => ({
  createReview: vi.fn(),
}))

vi.mock('../utils/reviewerName', () => ({
  getReviewerName: vi.fn(),
}))

const mockedCreateReview = vi.mocked(createReview)
const mockedGetReviewerName = vi.mocked(getReviewerName)

const sampleReview: Review = {
  sk_movie_review_id: 'r1',
  nome: 'Ana',
  nota: 7.5,
  comentario: 'Muito bom',
  created_at: '2026-01-01T00:00:00Z',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReviewForm', () => {
  it('blocks submission and shows an error when no score was chosen', async () => {
    const onCreated = vi.fn()
    render(<ReviewForm movieId="m1" onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'Bom filme' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar avaliação/i }))

    expect(await screen.findByText('Selecione uma nota antes de enviar.')).toBeInTheDocument()
    expect(mockedCreateReview).not.toHaveBeenCalled()
  })

  it('submits the trimmed comment with the stored reviewer name and resets the form', async () => {
    mockedGetReviewerName.mockReturnValue('Ana')
    mockedCreateReview.mockResolvedValue(sampleReview)
    const onCreated = vi.fn()
    render(<ReviewForm movieId="m1" onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText('Nota de 0 a 10'), { target: { value: '7.5' } })
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: '  Muito bom  ' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar avaliação/i }))

    await waitFor(() =>
      expect(mockedCreateReview).toHaveBeenCalledWith('m1', {
        nome: 'Ana',
        nota: 7.5,
        comentario: 'Muito bom',
      }),
    )
    expect(onCreated).toHaveBeenCalledWith(sampleReview)
    expect(screen.getByLabelText('Comentário')).toHaveValue('')
  })

  it('shows the API error message when submission fails', async () => {
    mockedGetReviewerName.mockReturnValue('Ana')
    mockedCreateReview.mockRejectedValue(new ApiError(400, 'Nota inválida'))
    render(<ReviewForm movieId="m1" onCreated={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Nota de 0 a 10'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Comentário'), { target: { value: 'Ok' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar avaliação/i }))

    expect(await screen.findByText('Nota inválida')).toBeInTheDocument()
  })
})
