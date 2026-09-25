import { Star } from '@phosphor-icons/react'
import { useState } from 'react'

import { focusRingClass } from '../styles/interactive'

const STAR_COUNT = 10
const STAR_SIZE = 26
const STARS = Array.from({ length: STAR_COUNT }, (_, index) => index)

const rangeThumbClass =
  'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent ' +
  '[&::-webkit-slider-runnable-track]:appearance-none [&::-moz-range-track]:appearance-none ' +
  '[&::-webkit-slider-thumb]:h-12 [&::-webkit-slider-thumb]:w-1 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:opacity-0 ' +
  '[&::-moz-range-thumb]:h-12 [&::-moz-range-thumb]:w-1 ' +
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:opacity-0'

const starTransitionClass = 'transition-transform duration-150 ease-out motion-reduce:transition-none'

interface StarSliderProps {
  id: string
  value: number | null
  onChange: (value: number) => void
  onCommit: () => void
}

/** Faixa de 10 estrelas com preenchimento contínuo, mapeada 1:1 para a escala 0-10 do banco
 * (não 5 estrelas / escala 1-5 — ver DESIGN.md). A interação é um <input type="range"> nativo
 * transparente por cima do visual, para herdar teclado/ARIA/touch corretos de graça. Passar o
 * mouse sobre uma estrela dá um leve zoom nela (decorativo, não afeta o valor). */
function StarSlider({ id, value, onChange, onCommit }: StarSliderProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const percent = ((value ?? 0) / STAR_COUNT) * 100

  function starScale(index: number) {
    return hoveredIndex === index ? 'scale(1.4)' : 'scale(1)'
  }

  function handlePointerMove(event: React.PointerEvent<HTMLInputElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHoveredIndex(Math.min(STAR_COUNT - 1, Math.floor(ratio * STAR_COUNT)))
  }

  function handlePointerLeave() {
    setHoveredIndex(null)
  }

  return (
    <div className="relative inline-flex h-12 w-fit items-center">
      <div className="flex gap-1">
        {STARS.map((index) => (
          <Star
            key={index}
            size={STAR_SIZE}
            className={`text-border ${starTransitionClass}`}
            style={{ transform: starScale(index) }}
          />
        ))}
      </div>
      <div
        className="absolute inset-y-0 left-0 flex items-center gap-1 overflow-hidden transition-[width] duration-150 ease-out motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
        aria-hidden="true"
      >
        {STARS.map((index) => (
          <Star
            key={index}
            size={STAR_SIZE}
            weight="fill"
            className={`shrink-0 text-accent ${starTransitionClass}`}
            style={{ transform: starScale(index) }}
          />
        ))}
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={STAR_COUNT}
        step={0.1}
        value={value ?? 0}
        aria-label="Nota de 0 a 10"
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className={`${rangeThumbClass} ${focusRingClass} rounded-md`}
      />
    </div>
  )
}

export default StarSlider
