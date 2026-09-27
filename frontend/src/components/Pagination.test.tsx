import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Pagination from './Pagination'

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('marks the current page and disables Previous on the first page', () => {
    render(<Pagination page={1} totalPages={20} onPageChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled()
  })

  it('disables Next on the last page', () => {
    render(<Pagination page={20} totalPages={20} onPageChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  it('shows an ellipsis before the trailing last page when there is a gap', () => {
    render(<Pagination page={1} totalPages={20} onPageChange={() => {}} />)

    expect(screen.getByText('…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '19' })).not.toBeInTheDocument()
  })

  it('shows ellipses on both sides when the current page is in the middle', () => {
    render(<Pagination page={10} totalPages={20} onPageChange={() => {}} />)

    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-current', 'page')
  })

  it('calls onPageChange with the clicked page number', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<Pagination page={1} totalPages={20} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: '3' }))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange with page + 1 when Next is clicked', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<Pagination page={3} totalPages={20} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(onPageChange).toHaveBeenCalledWith(4)
  })
})
