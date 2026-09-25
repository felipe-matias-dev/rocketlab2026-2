import { useState, type FormEvent, type ReactNode } from 'react'

import { getReviewerName, setReviewerName } from '../utils/reviewerName'
import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'

interface ReviewerNameGateProps {
  children: ReactNode
}

/** Pergunta o nome de quem está avaliando uma vez por sessão (sessionStorage), para não pedir
 * de novo em cada formulário de avaliação. Não é autenticação — é só preenchimento automático. */
function ReviewerNameGate({ children }: ReviewerNameGateProps) {
  const [name, setName] = useState(() => getReviewerName())
  const [draft, setDraft] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return

    setReviewerName(trimmed)
    setName(trimmed)
  }

  if (name) return children

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-md bg-surface p-6 shadow-[0_4px_8px_rgba(28,25,23,0.06),0_20px_32px_-8px_rgba(28,25,23,0.18)] ring-1 ring-black/5 motion-safe:animate-pop-in motion-reduce:animate-none">
        <h1 className="text-lg font-semibold text-ink">Como podemos te chamar?</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Usamos seu nome só para identificar as avaliações que você adicionar durante esta sessão.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            autoFocus
            required
            maxLength={120}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Seu nome"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className={`inline-flex w-fit items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${pressableClass} ${focusRingClass}`}
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  )
}

export default ReviewerNameGate
