import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import type { MovieListItem } from '../types/movie'
import MovieCard from './MovieCard'

const baseMovie: MovieListItem = {
  sk_movie_id: 'm1',
  titulo: 'Duna',
  ano_lancamento: 2021,
  url_poster: 'https://image.tmdb.org/t/p/w342/duna.jpg',
  nota_media: 8.4,
  qtd_avaliacoes: 3,
  popularidade: 120,
}

function renderCard(movie: MovieListItem, frameNumber = '001') {
  return render(
    <MemoryRouter>
      <MovieCard movie={movie} frameNumber={frameNumber} />
    </MemoryRouter>,
  )
}

describe('MovieCard', () => {
  it('renders the title, year and frame number', () => {
    renderCard(baseMovie)

    expect(screen.getByText('Duna')).toBeInTheDocument()
    expect(screen.getByText('2021')).toBeInTheDocument()
    expect(screen.getByText('001')).toBeInTheDocument()
  })

  it('links to the movie detail page', () => {
    renderCard(baseMovie)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/movies/m1')
  })

  it('shows the average rating badge when there are reviews', () => {
    renderCard(baseMovie)

    expect(screen.getByText('8.4')).toBeInTheDocument()
    expect(screen.queryByText('Sem avaliações')).not.toBeInTheDocument()
  })

  it('shows "Sem avaliações" and no rating badge when there are no reviews', () => {
    renderCard({ ...baseMovie, qtd_avaliacoes: 0, nota_media: null })

    expect(screen.getByText('Sem avaliações')).toBeInTheDocument()
    expect(screen.queryByText('8.4')).not.toBeInTheDocument()
  })

  it('shows a placeholder instead of an <img> when there is no poster', () => {
    renderCard({ ...baseMovie, url_poster: null })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the poster image with the movie title as alt text', () => {
    renderCard(baseMovie)

    expect(screen.getByRole('img', { name: 'Duna' })).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w342/duna.jpg',
    )
  })

  it('shows a dash for the year when it is unknown', () => {
    renderCard({ ...baseMovie, ano_lancamento: null })

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
