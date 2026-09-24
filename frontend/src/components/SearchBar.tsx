import { MagnifyingGlass } from '@phosphor-icons/react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-sm">
      <MagnifyingGlass
        size={18}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por título..."
        aria-label="Buscar por título"
        className="w-full rounded-md border border-border bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
      />
    </div>
  )
}

export default SearchBar
