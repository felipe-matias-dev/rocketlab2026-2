import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMovie } from '../api/movies'
import { ToastProvider } from '../components/Toast'
import type { MovieDetail, MovieInput } from '../types/movie'
import CreateMoviePage from './CreateMoviePage'

vi.mock('../api/movies', () => ({
  createMovie: vi.fn(),
}))

// The form's own behavior (validation, field mapping) is already covered by MovieForm.test.tsx.
// Here we only care that this page wires the right submit/success handlers to it.
vi.mock('../components/MovieForm', () => ({
  default: ({
    submitLabel,
    onSubmit,
    onSuccess,
  }: {
    submitLabel: string
    onSubmit: (input: MovieInput) => Promise<MovieDetail>
    onSuccess: (movie: MovieDetail) => void
  }) => (
    <div>
      <p>{submitLabel}</p>
      <button
        onClick={async () => {
          const movie = await onSubmit({} as MovieInput)
          onSuccess(movie)
        }}
      >
        Fake submit
      </button>
    </div>
  ),
}))

const mockedCreateMovie = vi.mocked(createMovie)

const createdMovie = { sk_movie_id: 'm1', titulo: 'Duna' } as MovieDetail

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/movies/new', element: <CreateMoviePage /> },
      { path: '/movies/:movieId', element: <p>Página do filme</p> },
    ],
    { initialEntries: ['/movies/new'] },
  )
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('CreateMoviePage', () => {
  it('passes the create-movie submit label to the form', () => {
    mockedCreateMovie.mockResolvedValue(createdMovie)
    renderPage()

    expect(screen.getByText('Cadastrar filme')).toBeInTheDocument()
  })

  it('creates the movie via the movies API', async () => {
    mockedCreateMovie.mockResolvedValue(createdMovie)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Fake submit' }))

    await waitFor(() => expect(mockedCreateMovie).toHaveBeenCalledWith({}))
  })

  it('shows a success toast and navigates to the new movie on success', async () => {
    mockedCreateMovie.mockResolvedValue(createdMovie)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Fake submit' }))

    expect(await screen.findByText('Filme cadastrado com sucesso.')).toBeInTheDocument()
    expect(await screen.findByText('Página do filme')).toBeInTheDocument()
  })
})
