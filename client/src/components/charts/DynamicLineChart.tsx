import { useState, useEffect } from 'react'
import { ChartSkeleton } from './LazyChart'

interface DynamicLineChartProps {
  data: any[]
  height?: number
  xAxisKey?: string
  lines: Array<{
    dataKey: string
    stroke: string
    strokeWidth?: number
    name: string
    strokeDasharray?: string
  }>
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  yAxisFormatter?: (value: any) => string
  tooltipFormatter?: (value: any, name: any) => [string, string]
}

export function DynamicLineChart({
  data,
  height = 300,
  xAxisKey = 'year',
  lines,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  yAxisFormatter,
  tooltipFormatter
}: DynamicLineChartProps) {
  const [Chart, setChart] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadChart() {
      try {
        const recharts = await import('recharts')
        if (isMounted) {
          setChart({
            ResponsiveContainer: recharts.ResponsiveContainer,
            LineChart: recharts.LineChart,
            Line: recharts.Line,
            XAxis: recharts.XAxis,
            YAxis: recharts.YAxis,
            CartesianGrid: recharts.CartesianGrid,
            Tooltip: recharts.Tooltip,
            Legend: recharts.Legend
          })
          setLoading(false)
        }
      } catch (error) {
        clientLogger.error('DynamicLineChart', 'Failed to load chart library', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadChart()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading || !Chart) {
    return <ChartSkeleton height={height} />
  }

  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Chart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis tickFormatter={yAxisFormatter} />
        {showTooltip && <Tooltip formatter={tooltipFormatter} />}
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={line.strokeWidth || 2}
            name={line.name}
            strokeDasharray={line.strokeDasharray}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}