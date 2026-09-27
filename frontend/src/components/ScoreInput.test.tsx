import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ScoreInput from './ScoreInput'

describe('ScoreInput', () => {
  it('labels the field with the 0-10 scale, not stars or 1-5', () => {
    render(<ScoreInput id="nota" value={null} onChange={() => {}} />)

    expect(screen.getByText('Nota (0 a 10)')).toBeInTheDocument()
  })

  it('shows a placeholder when no score was chosen yet', () => {
    render(<ScoreInput id="nota" value={null} onChange={() => {}} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the score with one decimal place', () => {
    render(<ScoreInput id="nota" value={8} onChange={() => {}} />)

    expect(screen.getByText('8.0')).toBeInTheDocument()
  })

  it('forwards changes from the underlying slider', () => {
    const onChange = vi.fn()
    render(<ScoreInput id="nota" value={null} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Nota de 0 a 10'), { target: { value: '6' } })

    expect(onChange).toHaveBeenCalledWith(6)
  })
})
