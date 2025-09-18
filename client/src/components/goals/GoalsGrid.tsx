import { memo } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { GoalCard } from "@/components/goals/GoalCard"
import { Goal } from "@/types/goals"

interface GoalsGridProps {
  goals: Goal[]
  viewMode: 'grid' | 'list'
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onEdit: (goal: Goal) => void
  onDelete: (goal: Goal) => void
}

export const GoalsGrid = memo(function GoalsGrid({
  goals,
  viewMode,
  currentPage,
  itemsPerPage,
  onPageChange,
  onEdit,
  onDelete
}: GoalsGridProps) {
  const totalPages = Math.ceil(goals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentGoals = goals.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Goals Grid/List */}
      <div className={
        viewMode === 'grid'
          ? "columns-1 md:columns-2 lg:columns-3 gap-x-6"
          : "space-y-4"
      }>
        {currentGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={() => onEdit(goal)}
            onDelete={() => onDelete(goal)}
            className={viewMode === 'list' ? 'w-full' : ''}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {startIndex + 1}-{Math.min(endIndex, goals.length)} of {goals.length} goals
      </div>
    </div>
  )
})