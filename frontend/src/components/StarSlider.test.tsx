import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import StarSlider from './StarSlider'

describe('StarSlider', () => {
  it('exposes the 0-10 rating scale on the underlying range input', () => {
    render(<StarSlider id="nota" value={null} onChange={() => {}} onCommit={() => {}} />)

    const input = screen.getByLabelText('Nota de 0 a 10')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '10')
  })

  it('calls onChange with the numeric value when moved', () => {
    const onChange = vi.fn()
    render(<StarSlider id="nota" value={3} onChange={onChange} onCommit={() => {}} />)

    fireEvent.change(screen.getByLabelText('Nota de 0 a 10'), { target: { value: '7.5' } })

    expect(onChange).toHaveBeenCalledWith(7.5)
  })

  it('calls onCommit when the pointer is released', () => {
    const onCommit = vi.fn()
    render(<StarSlider id="nota" value={3} onChange={() => {}} onCommit={onCommit} />)

    fireEvent.pointerUp(screen.getByLabelText('Nota de 0 a 10'))

    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('defaults the input value to 0 when no value is selected yet', () => {
    render(<StarSlider id="nota" value={null} onChange={() => {}} onCommit={() => {}} />)

    expect(screen.getByLabelText('Nota de 0 a 10')).toHaveValue('0')
  })
})
