import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ToastProvider, useToast } from './Toast'

function ToastTrigger() {
  const { showToast } = useToast()
  return (
    <>
      <button onClick={() => showToast('Salvo com sucesso')}>Mostrar sucesso</button>
      <button onClick={() => showToast('Algo deu errado', 'error')}>Mostrar erro</button>
    </>
  )
}

describe('useToast', () => {
  it('throws when used outside a ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function Consumer() {
      useToast()
      return null
    }

    expect(() => render(<Consumer />)).toThrow('useToast must be used within a ToastProvider')

    consoleError.mockRestore()
  })
})

describe('ToastProvider', () => {
  it('shows a success toast when triggered', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar sucesso' }))

    expect(screen.getByRole('status')).toHaveTextContent('Salvo com sucesso')
  })

  it('shows multiple toasts stacked at once', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar sucesso' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar erro' }))

    expect(screen.getAllByRole('status')).toHaveLength(2)
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  describe('dismissing a toast', () => {
    it('removes the toast after its close button is clicked', async () => {
      render(
        <ToastProvider>
          <ToastTrigger />
        </ToastProvider>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Mostrar sucesso' }))
      fireEvent.click(screen.getByRole('button', { name: 'Fechar notificação' }))

      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    })

    it('auto-dismisses a toast after a few seconds', async () => {
      render(
        <ToastProvider>
          <ToastTrigger />
        </ToastProvider>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Mostrar sucesso' }))

      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
        timeout: 5000,
      })
    }, 6000)
  })
})
