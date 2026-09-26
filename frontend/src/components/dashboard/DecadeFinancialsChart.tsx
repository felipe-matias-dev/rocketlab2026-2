import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '../../styles/chartColors'
import type { FinancialsByDecade } from '../../types/dashboard'

function formatUsdCompact(value: number): string {
  if (value >= 1_000_000_000) return `US$ ${(value / 1_000_000_000).toFixed(1)}bi`
  if (value >= 1_000_000) return `US$ ${(value / 1_000_000).toFixed(1)}mi`
  if (value >= 1_000) return `US$ ${(value / 1_000).toFixed(0)}mil`
  return `US$ ${value.toFixed(0)}`
}

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
        <Tooltip
          cursor={{ fill: chartColors.surfaceMuted }}
          contentStyle={{
            backgroundColor: chartColors.surface,
            border: `1px solid ${chartColors.border}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: chartColors.ink }}
          formatter={(value: number) => formatUsdCompact(value)}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: chartColors.inkMuted }} />
        <Bar dataKey="orcamento" name="Orçamento médio" fill={chartColors.inkMuted} radius={[4, 4, 0, 0]} />
        <Bar dataKey="receita" name="Receita média" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DecadeFinancialsChart
