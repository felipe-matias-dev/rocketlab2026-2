import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'

type ToastVariant = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
  dismissing: boolean
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
const AUTO_DISMISS_MS = 4000
const EXIT_DURATION_MS = 200

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const requestDismiss = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, dismissing: true } : toast)))
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, EXIT_DURATION_MS)
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = idRef.current++
      setToasts((current) => [...current, { id, message, variant, dismissing: false }])
      setTimeout(() => requestDismiss(id), AUTO_DISMISS_MS)
    },
    [requestDismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => requestDismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const Icon = toast.variant === 'success' ? CheckCircle : WarningCircle
  const iconColor = toast.variant === 'success' ? 'text-success' : 'text-destructive'

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md bg-surface px-4 py-3 shadow-[0_4px_8px_rgba(28,25,23,0.06),0_20px_32px_-8px_rgba(28,25,23,0.18)] ring-1 ring-black/5 ${
        toast.dismissing
          ? 'motion-safe:animate-toast-out motion-reduce:animate-none'
          : 'motion-safe:animate-toast-in motion-reduce:animate-none'
      }`}
    >
      <Icon size={20} weight="fill" className={`shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar notificação"
        className={`shrink-0 rounded-full p-1 text-ink-muted hover:bg-accent/10 hover:text-ink ${pressableClass} ${focusRingClass}`}
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
