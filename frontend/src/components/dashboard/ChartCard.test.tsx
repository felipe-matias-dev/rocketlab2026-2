import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ChartCard, { ChartCardSkeleton } from './ChartCard'

describe('ChartCard', () => {
  it('renders the title and its children', () => {
    render(
      <ChartCard title="Filmes por ano">
        <p>Gráfico</p>
      </ChartCard>,
    )

    expect(screen.getByRole('heading', { name: 'Filmes por ano' })).toBeInTheDocument()
    expect(screen.getByText('Gráfico')).toBeInTheDocument()
  })
})

describe('ChartCardSkeleton', () => {
  it('renders the title without the chart content', () => {
    render(<ChartCardSkeleton title="Filmes por ano" />)

    expect(screen.getByRole('heading', { name: 'Filmes por ano' })).toBeInTheDocument()
  })
})
