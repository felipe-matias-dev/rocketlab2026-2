import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import ReviewerNameGate from './ReviewerNameGate'

describe('ReviewerNameGate', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shows the name prompt and hides children when no name is stored', () => {
    render(
      <ReviewerNameGate>
        <p>Conteúdo protegido</p>
      </ReviewerNameGate>,
    )

    expect(screen.getByRole('heading', { name: 'Como podemos te chamar?' })).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('renders children immediately when a name was already stored this session', () => {
    sessionStorage.setItem('rocketlab:reviewerName', 'Ana')

    render(
      <ReviewerNameGate>
        <p>Conteúdo protegido</p>
      </ReviewerNameGate>,
    )

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Como podemos te chamar?' })).not.toBeInTheDocument()
  })

  it('disables submit while the name field is empty', () => {
    render(
      <ReviewerNameGate>
        <p>Conteúdo protegido</p>
      </ReviewerNameGate>,
    )

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('does not submit a whitespace-only name', () => {
    render(
      <ReviewerNameGate>
        <p>Conteúdo protegido</p>
      </ReviewerNameGate>,
    )

    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: '   ' } })
    fireEvent.submit(screen.getByPlaceholderText('Seu nome').closest('form')!)

    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('reveals children and persists the trimmed name after submitting', () => {
    render(
      <ReviewerNameGate>
        <p>Conteúdo protegido</p>
      </ReviewerNameGate>,
    )

    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: '  Ana  ' } })
    fireEvent.submit(screen.getByPlaceholderText('Seu nome').closest('form')!)

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
    expect(sessionStorage.getItem('rocketlab:reviewerName')).toBe('Ana')
  })
})
