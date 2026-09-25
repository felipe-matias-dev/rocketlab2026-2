// Feedback de clique (":active") compartilhado para botões/links — combina com o focusRingClass.
// A lista explícita de propriedades (em vez de transition-all) evita brigar com transition-colors
// já aplicadas no mesmo elemento.
export const pressableClass =
  'transition-[color,background-color,border-color,box-shadow,transform] duration-100 ease-out ' +
  'active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:active:opacity-80'

// Atraso escalonado para entrada de listas/grids, limitado pra nunca arrastar uma página de 20
// itens por mais de `maxMs` de atraso extra.
export function staggerDelayMs(index: number, stepMs = 15, maxMs = 150): number {
  return Math.min(index * stepMs, maxMs)
}
