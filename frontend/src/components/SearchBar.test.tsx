import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SearchBar from './SearchBar'

describe('SearchBar', () => {
  it('renders the current value', () => {
    render(<SearchBar value="matrix" onChange={() => {}} />)

    expect(screen.getByLabelText('Buscar por título')).toHaveValue('matrix')
  })

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Buscar por título'), { target: { value: 'matrix' } })

    expect(onChange).toHaveBeenCalledWith('matrix')
  })
})
