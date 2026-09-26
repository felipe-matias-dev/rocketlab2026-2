import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '../../styles/chartColors'
import type { MoviesByYear } from '../../types/dashboard'

function MoviesByYearChart({ data }: { data: MoviesByYear[] }) {
  const chartData = data.map((item) => ({ ano: String(item.ano), qtd: item.qtd }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="ano"
          tick={{ fill: chartColors.inkMuted, fontSize: 11 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: chartColors.inkMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
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
        />
        <Bar dataKey="qtd" name="Filmes" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default MoviesByYearChart
