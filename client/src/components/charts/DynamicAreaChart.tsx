import { useState, useEffect } from 'react'
import { ChartSkeleton } from './LazyChart'

interface DynamicAreaChartProps {
  data: any[]
  height?: number
  xAxisKey?: string
  areas: Array<{
    dataKey: string
    stroke: string
    fill: string
    fillOpacity?: number
    name: string
    stackId?: string
  }>
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  tooltipFormatter?: (value: any, name: any) => [string, string]
}

export function DynamicAreaChart({
  data,
  height = 300,
  xAxisKey = 'year', 
  areas,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  tooltipFormatter
}: DynamicAreaChartProps) {
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
            AreaChart: recharts.AreaChart,
            Area: recharts.Area,
            XAxis: recharts.XAxis,
            YAxis: recharts.YAxis,
            CartesianGrid: recharts.CartesianGrid,
            Tooltip: recharts.Tooltip,
            Legend: recharts.Legend
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load chart library:', error)
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

  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Chart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        {showTooltip && <Tooltip formatter={tooltipFormatter} />}
        {showLegend && <Legend />}
        {areas.map((area, index) => (
          <Area
            key={index}
            type="monotone"
            dataKey={area.dataKey}
            stackId={area.stackId}
            stroke={area.stroke}
            fill={area.fill}
            fillOpacity={area.fillOpacity || 0.6}
            name={area.name}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}