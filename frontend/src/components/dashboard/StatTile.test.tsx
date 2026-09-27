import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import StatTile from './StatTile'

describe('StatTile', () => {
  it('renders the label and value', () => {
    render(<StatTile label="Total de filmes" value="95.645" />)

    expect(screen.getByText('Total de filmes')).toBeInTheDocument()
    expect(screen.getByText('95.645')).toBeInTheDocument()
  })

  it('renders the sublabel when provided', () => {
    render(<StatTile label="Nota média" value="7.2" sublabel="entre os avaliados" />)

    expect(screen.getByText('entre os avaliados')).toBeInTheDocument()
  })

  it('omits the sublabel paragraph when none is provided', () => {
    render(<StatTile label="Nota média" value="7.2" />)

    expect(screen.queryByText('entre os avaliados')).not.toBeInTheDocument()
  })
})
