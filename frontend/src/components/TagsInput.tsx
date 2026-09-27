import { X } from '@phosphor-icons/react'
import { useState } from 'react'

import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'

// Mesma linguagem visual de `inputClass` (MovieForm.tsx), mas com `focus-within:` no
// container em vez de `focus:` no input: aqui quem recebe foco é o <input> interno, não a
// div que desenha a borda/anel — `focus:` sozinho nunca acenderia visualmente.
const containerClass =
  'flex w-full flex-wrap items-center gap-1.5 rounded-md border border-zinc-400 bg-surface px-3 py-2 focus-within:border-accent-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-ink'

interface TagsInputProps {
  id: string
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  maxLength?: number
}

function TagsInput({ id, label, values, onChange, placeholder, maxLength = 255 }: TagsInputProps) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const trimmed = draft.trim()
    if (!trimmed) return
    const alreadyAdded = values.some((value) => value.toLowerCase() === trimmed.toLowerCase())
    if (!alreadyAdded) onChange([...values, trimmed])
    setDraft('')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitDraft()
    } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, valueIndex) => valueIndex !== index))
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className={containerClass}>
        {values.map((value, index) => (
          <span
            key={`${value.toLowerCase()}-${index}`}
            className="flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs text-ink"
          >
            {value}
            <button
              type="button"
              aria-label={`Remover ${value}`}
              onClick={() => removeAt(index)}
              className={`text-ink-muted hover:text-destructive ${pressableClass} ${focusRingClass}`}
            >
              <X size={10} weight="bold" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          maxLength={maxLength}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 bg-transparent text-sm text-ink outline-none"
        />
      </div>
    </div>
  )
}

export default TagsInput
