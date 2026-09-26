// Paleta mono âmbar/stone para os gráficos do dashboard, espelhando os tokens de DESIGN.md —
// nunca a paleta multi-hue padrão do Recharts, pra manter a "One Accent Rule" também nos
// gráficos. Cores como prop/estilo inline (não Tailwind) porque é assim que o Recharts colore
// SVG; isso não fere a regra de "Tailwind only", que mira CSS escrito à mão/CSS-in-JS.
export const chartColors = {
  accent: '#f59e0b',
  ink: '#1c1917',
  inkMuted: '#78716c',
  border: '#e3ddd0',
  surface: '#ffffff',
  surfaceMuted: '#eee9df',
} as const
