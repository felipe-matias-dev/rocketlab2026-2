interface ScoreInputProps {
  id: string
  value: string
  onChange: (value: string) => void
}

/** Nota na escala 0-10 do banco — nunca um widget de 5 estrelas (ver DESIGN.md). */
function ScoreInput({ id, value, onChange }: ScoreInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        Nota (0 a 10)
      </label>
      <input
        id={id}
        type="number"
        required
        min={0}
        max={10}
        step={0.1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
      />
    </div>
  )
}

export default ScoreInput
