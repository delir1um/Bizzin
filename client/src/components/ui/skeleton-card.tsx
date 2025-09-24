import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonCardProps {
  height?: number
}

export function SkeletonCard({ height = 520 }: SkeletonCardProps) {
  return (
    <Card className="relative overflow-hidden h-full flex flex-col" style={{ minHeight: height }}>
      {/* Header Zone */}
      <CardHeader className="flex flex-col items-center justify-center space-y-3 pb-4 min-h-[90px] relative z-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </CardHeader>

      <CardContent className="flex flex-col h-full space-y-4 relative z-10 pb-4 px-6">
        {/* Metric Zone */}
        <div className="text-center min-h-[110px] flex flex-col justify-center">
          <Skeleton className="h-14 w-20 mx-auto mb-3" />
          <Skeleton className="h-4 w-24 mx-auto mb-2" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>

        {/* Progress Zone */}
        <div className="space-y-2 min-h-[60px] px-2">
          <Skeleton className="w-full h-2 rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Stats Zone */}
        <div className="grid grid-cols-2 gap-6 text-sm min-h-[60px] items-center">
          <div className="text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>

        {/* Insight Zone */}
        <div className="min-h-[60px] flex items-center justify-center">
          <Skeleton className="w-full h-12 rounded-lg" />
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action Zone */}
        <div className="h-[44px] flex items-end">
          <Skeleton className="w-full h-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}