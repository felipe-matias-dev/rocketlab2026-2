import { useState } from 'react'

import StarSlider from './StarSlider'

interface ScoreInputProps {
  id: string
  value: number | null
  onChange: (value: number) => void
}

/** Nota na escala 0-10 do banco, via faixa de 10 estrelas com preenchimento contínuo (não 5
 * estrelas / escala 1-5 — ver DESIGN.md). */
function ScoreInput({ id, value, onChange }: ScoreInputProps) {
  const [commitToken, setCommitToken] = useState(0)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          Nota (0 a 10)
        </label>
        <span
          key={commitToken}
          className={`text-sm font-medium tabular-nums text-accent ${
            commitToken > 0 ? 'motion-safe:animate-star-pulse motion-reduce:animate-none' : ''
          }`}
        >
          {value === null ? '—' : value.toFixed(1)}
        </span>
      </div>
      <StarSlider
        id={id}
        value={value}
        onChange={onChange}
        onCommit={() => setCommitToken((token) => token + 1)}
      />
    </div>
  )
}

export default ScoreInput
