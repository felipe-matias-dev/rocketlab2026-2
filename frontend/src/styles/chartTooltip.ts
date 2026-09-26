import { chartColors } from './chartColors'

// Aparência compartilhada do <Tooltip> do Recharts entre os gráficos do dashboard — mantém
// cursor/contentStyle/labelStyle consistentes sem repetir o mesmo objeto em cada gráfico.
export const chartTooltipProps = {
  cursor: { fill: chartColors.surfaceMuted },
  contentStyle: {
    backgroundColor: chartColors.surface,
    border: `1px solid ${chartColors.border}`,
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: chartColors.ink },
}
