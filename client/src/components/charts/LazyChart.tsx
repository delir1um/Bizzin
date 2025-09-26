import { Suspense, ComponentType, lazy } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Chart loading skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full space-y-2" style={{ height }}>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  )
}

// Lazy load the entire recharts module
const LazyRechartsComponents = lazy(() => import('recharts'))

// Wrapper component that lazy loads recharts
export function ChartWrapper({ 
  children, 
  height = 300 
}: { 
  children: React.ReactNode
  height?: number 
}) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      {children}
    </Suspense>
  )
}

// Re-export recharts for typing but don't import at module level
export type {
  LineChart,
  AreaChart, 
  BarChart,
  PieChart,
  Line,
  Area,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Dynamic recharts hook for use in components
export function useRecharts() {
  return import('recharts')
}