import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RatingHistogramChart from './RatingHistogramChart'

// See MoviesByYearChart.test.tsx for why recharts itself is mocked here.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data, children }: { data: unknown; children: React.ReactNode }) => (
    <div data-testid="bar-chart" data-chart={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid="bar" data-key={dataKey} data-name={name} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

function chartData() {
  return JSON.parse(screen.getByTestId('bar-chart').dataset.chart!)
}

describe('RatingHistogramChart', () => {
  it('labels each bucket as a "start-end" range', () => {
    render(<RatingHistogramChart data={[{ faixa_inicio: 7, qtd: 12 }]} />)

    expect(chartData()).toEqual([{ faixa: '7-8', qtd: 12 }])
  })

  it('keeps one bucket per entry, in the given order', () => {
    render(
      <RatingHistogramChart
        data={[
          { faixa_inicio: 0, qtd: 3 },
          { faixa_inicio: 5, qtd: 40 },
          { faixa_inicio: 9, qtd: 7 },
        ]}
      />,
    )

    expect(chartData()).toEqual([
      { faixa: '0-1', qtd: 3 },
      { faixa: '5-6', qtd: 40 },
      { faixa: '9-10', qtd: 7 },
    ])
  })

  it('plots the review count on the "qtd" bar', () => {
    render(<RatingHistogramChart data={[{ faixa_inicio: 7, qtd: 12 }]} />)

    expect(screen.getByTestId('bar')).toHaveAttribute('data-key', 'qtd')
  })

  it('renders an empty chart instead of crashing when there is no data', () => {
    render(<RatingHistogramChart data={[]} />)

    expect(chartData()).toEqual([])
  })
})
