import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import RankingList, { type RankingItem } from './RankingList'

function renderList(items: RankingItem[]) {
  return render(
    <MemoryRouter>
      <RankingList items={items} emptyMessage="Nenhum filme ainda." />
    </MemoryRouter>,
  )
}

describe('RankingList', () => {
  it('shows the empty message when there are no items', () => {
    renderList([])

    expect(screen.getByText('Nenhum filme ainda.')).toBeInTheDocument()
  })

  it('numbers items starting at 1, in the given order', () => {
    renderList([
      { key: 'm1', title: 'Duna', value: '8.4' },
      { key: 'm2', title: 'Oppenheimer', value: '8.1' },
    ])

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders the title, value and optional subvalue', () => {
    renderList([{ key: 'm1', title: 'Duna', value: '8.4', subvalue: '12 avaliações' }])

    expect(screen.getByText('Duna')).toBeInTheDocument()
    expect(screen.getByText('8.4')).toBeInTheDocument()
    expect(screen.getByText('12 avaliações')).toBeInTheDocument()
  })

  it('links to the movie when an href is given', () => {
    renderList([{ key: 'm1', title: 'Duna', value: '8.4', href: '/movies/m1' }])

    expect(screen.getByRole('link')).toHaveAttribute('href', '/movies/m1')
  })

  it('renders a plain row, not a link, when no href is given', () => {
    renderList([{ key: 'm1', title: 'Duna', value: '8.4' }])

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
