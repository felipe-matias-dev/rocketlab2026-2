import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DecadeFinancialsChart from './DecadeFinancialsChart'

// See MoviesByYearChart.test.tsx for why recharts itself is mocked here.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data, children }: { data: unknown; children: React.ReactNode }) => (
    <div data-testid="bar-chart" data-chart={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`bar-${dataKey}`} data-name={name} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

function chartData() {
  return JSON.parse(screen.getByTestId('bar-chart').dataset.chart!)
}

describe('DecadeFinancialsChart', () => {
  it('labels each decade with an "s" suffix', () => {
    render(<DecadeFinancialsChart data={[{ decada: 1990, orcamento_medio_usd: 1000, receita_media_usd: 2000 }]} />)

    expect(chartData()).toEqual([{ decada: '1990s', orcamento: 1000, receita: 2000 }])
  })

  it('defaults a missing budget or revenue to zero instead of dropping the decade', () => {
    render(
      <DecadeFinancialsChart
        data={[{ decada: 1980, orcamento_medio_usd: null, receita_media_usd: null }]}
      />,
    )

    expect(chartData()).toEqual([{ decada: '1980s', orcamento: 0, receita: 0 }])
  })

  it('renders both a budget bar and a revenue bar', () => {
    render(<DecadeFinancialsChart data={[{ decada: 1990, orcamento_medio_usd: 1000, receita_media_usd: 2000 }]} />)

    expect(screen.getByTestId('bar-orcamento')).toHaveAttribute('data-name', 'Orçamento médio')
    expect(screen.getByTestId('bar-receita')).toHaveAttribute('data-name', 'Receita média')
  })

  it('renders an empty chart instead of crashing when there is no data', () => {
    render(<DecadeFinancialsChart data={[]} />)

    expect(chartData()).toEqual([])
  })
})
