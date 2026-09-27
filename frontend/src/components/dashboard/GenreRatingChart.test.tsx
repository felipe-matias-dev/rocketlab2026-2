import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { GenreRatingBreakdown } from '../../types/dashboard'
import GenreRatingChart from './GenreRatingChart'

// See MoviesByYearChart.test.tsx for why recharts itself is mocked here.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data, children }: { data: unknown; children: React.ReactNode }) => (
    <div data-testid="bar-chart" data-chart={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid="bar" data-key={dataKey} data-name={name} />
  ),
  XAxis: ({ domain }: { domain: unknown }) => <div data-testid="x-axis" data-domain={JSON.stringify(domain)} />,
  YAxis: ({ dataKey, type }: { dataKey: string; type: string }) => (
    <div data-testid="y-axis" data-key={dataKey} data-type={type} />
  ),
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

function chartData() {
  return JSON.parse(screen.getByTestId('bar-chart').dataset.chart!)
}

const genres: GenreRatingBreakdown[] = [
  { sk_genre_id: 'g1', nome_genero: 'Terror', nota_media: 6.2, qtd_avaliacoes: 10 },
  { sk_genre_id: 'g2', nome_genero: 'Drama', nota_media: 8.1, qtd_avaliacoes: 20 },
  { sk_genre_id: 'g3', nome_genero: 'Comédia', nota_media: null, qtd_avaliacoes: 0 },
]

describe('GenreRatingChart', () => {
  it('sorts genres by average rating, highest first', () => {
    render(<GenreRatingChart data={genres} />)

    expect(chartData().map((item: { nome: string }) => item.nome)).toEqual(['Drama', 'Terror', 'Comédia'])
  })

  it('renders a genre with no ratings yet as a zero-height bar, sorted last', () => {
    render(<GenreRatingChart data={genres} />)

    expect(chartData()).toEqual([
      { nome: 'Drama', nota: 8.1 },
      { nome: 'Terror', nota: 6.2 },
      { nome: 'Comédia', nota: 0 },
    ])
  })

  it('fixes the rating axis to the 0-10 scale regardless of the data', () => {
    render(<GenreRatingChart data={genres} />)

    expect(screen.getByTestId('x-axis')).toHaveAttribute('data-domain', '[0,10]')
  })

  it('plots the average rating on the "nota" bar', () => {
    render(<GenreRatingChart data={genres} />)

    expect(screen.getByTestId('bar')).toHaveAttribute('data-key', 'nota')
  })

  it('renders an empty chart instead of crashing when there is no data', () => {
    render(<GenreRatingChart data={[]} />)

    expect(chartData()).toEqual([])
  })
})
