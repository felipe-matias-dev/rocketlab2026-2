import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '../../styles/chartColors'
import { chartTooltipProps } from '../../styles/chartTooltip'
import type { RatingBucket } from '../../types/dashboard'

function RatingHistogramChart({ data }: { data: RatingBucket[] }) {
  const chartData = data.map((bucket) => ({
    faixa: `${bucket.faixa_inicio}-${bucket.faixa_inicio + 1}`,
    qtd: bucket.qtd,
  }))

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="faixa"
          tick={{ fill: chartColors.inkMuted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: chartColors.inkMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip {...chartTooltipProps} />
        <Bar dataKey="qtd" name="Avaliações" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RatingHistogramChart
