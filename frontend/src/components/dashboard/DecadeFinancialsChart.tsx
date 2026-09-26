import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '../../styles/chartColors'
import { chartTooltipProps } from '../../styles/chartTooltip'
import type { FinancialsByDecade } from '../../types/dashboard'
import { formatUsdCompact } from '../../utils/format'

function DecadeFinancialsChart({ data }: { data: FinancialsByDecade[] }) {
  const chartData = data.map((item) => ({
    decada: `${item.decada}s`,
    orcamento: item.orcamento_medio_usd ?? 0,
    receita: item.receita_media_usd ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="decada"
          tick={{ fill: chartColors.inkMuted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: chartColors.inkMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatUsdCompact}
          width={64}
        />
        <Tooltip {...chartTooltipProps} formatter={(value: number) => formatUsdCompact(value)} />
        <Legend wrapperStyle={{ fontSize: 12, color: chartColors.inkMuted }} />
        <Bar dataKey="orcamento" name="Orçamento médio" fill={chartColors.inkMuted} radius={[4, 4, 0, 0]} />
        <Bar dataKey="receita" name="Receita média" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DecadeFinancialsChart
