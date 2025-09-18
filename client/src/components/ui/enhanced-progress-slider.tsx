import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface EnhancedProgressSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value: number[]
  max: number
  maxProgressReached: number
  isCompleted?: boolean
  onValueChange?: (value: number[]) => void
  formatTime?: (seconds: number) => string
  currentTime?: number
  duration?: number
  className?: string
}

const EnhancedProgressSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  EnhancedProgressSliderProps
>(({ 
  className, 
  value, 
  max, 
  maxProgressReached, 
  isCompleted = false,
  onValueChange,
  formatTime,
  currentTime = 0,
  duration = 0,
  ...props 
}, ref) => {
  const currentPosition = value[0] || 0
  const maxProgressPercentage = max > 0 ? (maxProgressReached / max) * 100 : 0
  const currentPositionPercentage = max > 0 ? (currentPosition / max) * 100 : 0
  
  const handleValueChange = (newValue: number[]) => {
    const newTime = newValue[0]
    // Allow seeking within completion zone or if episode is completed
    if (isCompleted || newTime <= maxProgressReached + 2) {
      onValueChange?.(newValue)
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative">
        <SliderPrimitive.Root
          ref={ref}
          className="relative flex w-full touch-none select-none items-center"
          value={value}
          max={max}
          step={1}
          onValueChange={handleValueChange}
          {...props}
        >
          {/* Base track */}
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            {/* Completion zone background - shows how far user has progressed */}
            <div
              className="absolute h-full bg-orange-100 dark:bg-orange-900/30 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(maxProgressPercentage, 100)}%` }}
            />
            
            {/* Current position range - shows where user currently is */}
            <SliderPrimitive.Range 
              className={cn(
                "absolute h-full rounded-full transition-all duration-200",
                isCompleted 
                  ? "bg-green-500 dark:bg-green-400" 
                  : "bg-orange-500 dark:bg-orange-400"
              )}
            />
          </SliderPrimitive.Track>
          
          {/* Scrubber thumb */}
          <SliderPrimitive.Thumb className={cn(
            "block h-5 w-5 rounded-full border-2 bg-white shadow-md ring-offset-background",
            "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "hover:scale-110 disabled:pointer-events-none disabled:opacity-50",
            isCompleted
              ? "border-green-500 dark:border-green-400 focus-visible:ring-green-500"
              : "border-orange-500 dark:border-orange-400 focus-visible:ring-orange-500"
          )} />
        </SliderPrimitive.Root>
        
        {/* Visual indicator for max progress boundary */}
        {!isCompleted && maxProgressReached > 0 && (
          <div
            className="absolute top-0 h-2 w-1 bg-orange-300 dark:bg-orange-600 rounded-r-full transition-all duration-300"
            style={{ left: `${Math.min(maxProgressPercentage, 100)}%` }}
            title={`You've reached ${Math.round(maxProgressPercentage)}% of this episode`}
          />
        )}
      </div>
      
      {/* Time display and progress info */}
      <div className="flex justify-between items-center">
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
          <span>{formatTime ? formatTime(currentPosition) : `${Math.floor(currentPosition / 60)}:${String(Math.floor(currentPosition % 60)).padStart(2, '0')}`}</span>
          <span className="mx-2">/</span>
          <span>{formatTime ? formatTime(max) : `${Math.floor(max / 60)}:${String(Math.floor(max % 60)).padStart(2, '0')}`}</span>
        </div>
        
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {isCompleted ? (
            <span className="text-green-600 dark:text-green-400">✓ Completed</span>
          ) : (
            <span>Progress: {Math.round(maxProgressPercentage)}%</span>
          )}
        </div>
      </div>
      
      {/* Help text */}
      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        {isCompleted 
          ? "Episode completed! You can navigate freely through the content" 
          : maxProgressReached > 0
            ? "You can review any content you've already watched, but can't skip ahead"
            : "Start watching to begin tracking your progress"
        }
      </p>
    </div>
  )
})

EnhancedProgressSlider.displayName = "EnhancedProgressSlider"

export { EnhancedProgressSlider }