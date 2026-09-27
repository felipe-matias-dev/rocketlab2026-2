import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import TagsInput from './TagsInput'

function renderInput(values: string[] = []) {
  const onChange = vi.fn()
  render(<TagsInput id="tags" label="Diretores" values={values} onChange={onChange} />)
  return { onChange }
}

describe('TagsInput', () => {
  it('renders initial values as chips', () => {
    renderInput(['Ana Silva', 'Bia Santos'])

    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('Bia Santos')).toBeInTheDocument()
  })

  it('adds a chip on Enter and clears the draft', () => {
    const { onChange } = renderInput()
    const input = screen.getByLabelText('Diretores')

    fireEvent.change(input, { target: { value: 'Ana Silva' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(['Ana Silva'])
  })

  it('adds a chip on comma', () => {
    const { onChange } = renderInput()
    const input = screen.getByLabelText('Diretores')

    fireEvent.change(input, { target: { value: 'Ana Silva' } })
    fireEvent.keyDown(input, { key: ',' })

    expect(onChange).toHaveBeenCalledWith(['Ana Silva'])
  })

  it('commits a pending draft on blur', () => {
    const { onChange } = renderInput()
    const input = screen.getByLabelText('Diretores')

    fireEvent.change(input, { target: { value: 'Ana Silva' } })
    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledWith(['Ana Silva'])
  })

  it('removes the last chip on Backspace when the draft is empty', () => {
    const { onChange } = renderInput(['Ana Silva', 'Bia Santos'])
    const input = screen.getByLabelText('Diretores')

    fireEvent.keyDown(input, { key: 'Backspace' })

    expect(onChange).toHaveBeenCalledWith(['Ana Silva'])
  })

  it('does not remove a chip on Backspace while the draft has text', () => {
    const { onChange } = renderInput(['Ana Silva'])
    const input = screen.getByLabelText('Diretores')

    fireEvent.change(input, { target: { value: 'Bia' } })
    fireEvent.keyDown(input, { key: 'Backspace' })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes a chip when its remove button is clicked', () => {
    const { onChange } = renderInput(['Ana Silva', 'Bia Santos'])

    fireEvent.click(screen.getByLabelText('Remover Ana Silva'))

    expect(onChange).toHaveBeenCalledWith(['Bia Santos'])
  })

  it('ignores a duplicate name (case-insensitive)', () => {
    const { onChange } = renderInput(['Ana Silva'])
    const input = screen.getByLabelText('Diretores')

    fireEvent.change(input, { target: { value: 'ana silva' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores an empty draft on Enter', () => {
    const { onChange } = renderInput()
    const input = screen.getByLabelText('Diretores')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
  })
})
