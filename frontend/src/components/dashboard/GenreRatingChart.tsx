import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '../../styles/chartColors'
import { chartTooltipProps } from '../../styles/chartTooltip'
import type { GenreRatingBreakdown } from '../../types/dashboard'

function GenreRatingChart({ data }: { data: GenreRatingBreakdown[] }) {
  const chartData = [...data]
    .sort((a, b) => (b.nota_media ?? -1) - (a.nota_media ?? -1))
    .map((genre) => ({
      nome: genre.nome_genero,
      nota: genre.nota_media ?? 0,
    }))

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.border} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          tick={{ fill: chartColors.inkMuted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={120}
          tick={{ fill: chartColors.ink, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...chartTooltipProps} formatter={(value: number) => value.toFixed(1)} />
        <Bar dataKey="nota" name="Nota média" fill={chartColors.accent} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default GenreRatingChart
