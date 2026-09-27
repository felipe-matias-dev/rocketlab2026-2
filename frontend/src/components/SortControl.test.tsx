import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SortControl from './SortControl'

describe('SortControl', () => {
  it('calls onSortChange with the selected option', () => {
    const onSortChange = vi.fn()
    render(<SortControl sort="title" order="asc" onSortChange={onSortChange} onOrderChange={() => {}} />)

    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'rating' } })

    expect(onSortChange).toHaveBeenCalledWith('rating')
  })

  it('describes ascending order in the toggle button label', () => {
    render(<SortControl sort="title" order="asc" onSortChange={() => {}} onOrderChange={() => {}} />)

    expect(screen.getByRole('button', { name: /ordem crescente/i })).toBeInTheDocument()
  })

  it('describes descending order in the toggle button label', () => {
    render(<SortControl sort="title" order="desc" onSortChange={() => {}} onOrderChange={() => {}} />)

    expect(screen.getByRole('button', { name: /ordem decrescente/i })).toBeInTheDocument()
  })

  it('flips from ascending to descending when the toggle is clicked', () => {
    const onOrderChange = vi.fn()
    render(<SortControl sort="title" order="asc" onSortChange={() => {}} onOrderChange={onOrderChange} />)

    fireEvent.click(screen.getByRole('button', { name: /ordem crescente/i }))

    expect(onOrderChange).toHaveBeenCalledWith('desc')
  })

  it('flips from descending to ascending when the toggle is clicked', () => {
    const onOrderChange = vi.fn()
    render(<SortControl sort="title" order="desc" onSortChange={() => {}} onOrderChange={onOrderChange} />)

    fireEvent.click(screen.getByRole('button', { name: /ordem decrescente/i }))

    expect(onOrderChange).toHaveBeenCalledWith('asc')
  })
})
