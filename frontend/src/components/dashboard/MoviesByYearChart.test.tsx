import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import MoviesByYearChart from './MoviesByYearChart'

// Recharts needs real layout (getBoundingClientRect/ResizeObserver) to render its SVG, which
// jsdom fakes with zeroed values — it either renders nothing or silently drops/skips data
// points. Mocking the primitives lets us assert on the data *we* computed and handed to them,
// which is the only logic this component actually owns.
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
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

function chartData() {
  return JSON.parse(screen.getByTestId('bar-chart').dataset.chart!)
}

describe('MoviesByYearChart', () => {
  it('converts the year to a string for the category axis', () => {
    render(<MoviesByYearChart data={[{ ano: 2020, qtd: 5 }]} />)

    expect(chartData()).toEqual([{ ano: '2020', qtd: 5 }])
  })

  it('keeps one entry per year, in the given order', () => {
    render(
      <MoviesByYearChart
        data={[
          { ano: 2020, qtd: 5 },
          { ano: 2021, qtd: 8 },
          { ano: 2022, qtd: 3 },
        ]}
      />,
    )

    expect(chartData()).toEqual([
      { ano: '2020', qtd: 5 },
      { ano: '2021', qtd: 8 },
      { ano: '2022', qtd: 3 },
    ])
  })

  it('renders an empty chart instead of crashing when there is no data', () => {
    render(<MoviesByYearChart data={[]} />)

    expect(chartData()).toEqual([])
  })

  it('plots the movie count on the "qtd" bar', () => {
    render(<MoviesByYearChart data={[{ ano: 2020, qtd: 5 }]} />)

    expect(screen.getByTestId('bar')).toHaveAttribute('data-key', 'qtd')
  })
})
