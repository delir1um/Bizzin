// Comprehensive logging system for tracking goal operations
import { Goal } from '@/types/goals'

interface LogEntry {
  timestamp: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'CONVERT' | 'ERROR'
  goalId?: string
  userId?: string
  data?: any
  error?: any
  context?: string
  stackTrace?: string
}

class GoalLogger {
  private logs: LogEntry[] = []
  private maxLogs = 100 // Keep last 100 logs

  private addLog(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    }
    
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    // Console log for immediate debugging
    console.log(`[GOAL_${entry.operation}]`, {
      time: new Date().toLocaleTimeString(),
      ...entry
    })
  }

  logCreate(goalData: any, userId: string, context?: string) {
    this.addLog({
      operation: 'CREATE',
      userId,
      data: { ...goalData },
      context
    })
  }

  logUpdate(goalId: string, updates: any, userId: string, context?: string) {
    this.addLog({
      operation: 'UPDATE',
      goalId,
      userId,
      data: { ...updates },
      context
    })
  }

  logDelete(goalId: string, userId: string, context?: string) {
    this.addLog({
      operation: 'DELETE',
      goalId,
      userId,
      context
    })
  }

  logConvert(goalId: string, fromType: string, toType: string, userId: string, additionalData?: any) {
    this.addLog({
      operation: 'CONVERT',
      goalId,
      userId,
      data: {
        from: fromType,
        to: toType,
        ...additionalData
      },
      context: `Converting from ${fromType} to ${toType}`
    })
  }

  logError(operation: string, error: any, goalId?: string, userId?: string, context?: string) {
    this.addLog({
      operation: 'ERROR',
      goalId,
      userId,
      error: {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      },
      context: `Error during ${operation}: ${context || ''}`
    })
  }

  // Get filtered logs for analysis
  getLogsByGoal(goalId: string): LogEntry[] {
    return this.logs.filter(log => log.goalId === goalId)
  }

  getLogsByOperation(operation: LogEntry['operation']): LogEntry[] {
    return this.logs.filter(log => log.operation === operation)
  }

  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logs.slice(0, count)
  }

  getAllLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Analysis functions
  analyzeGoalOperations(goalId: string): {
    operations: LogEntry[]
    summary: string
    issues: string[]
  } {
    const operations = this.getLogsByGoal(goalId)
    const issues: string[] = []
    
    // Check for rapid updates
    const updates = operations.filter(op => op.operation === 'UPDATE')
    if (updates.length > 3) {
      const timeSpan = new Date(updates[0].timestamp).getTime() - 
                      new Date(updates[updates.length - 1].timestamp).getTime()
      if (timeSpan < 10000) { // Less than 10 seconds
        issues.push(`Rapid updates detected: ${updates.length} updates in ${timeSpan}ms`)
      }
    }

    // Check for errors
    const errors = operations.filter(op => op.operation === 'ERROR')
    if (errors.length > 0) {
      issues.push(`${errors.length} error(s) detected`)
    }

    // Check for conversion issues
    const conversions = operations.filter(op => op.operation === 'CONVERT')
    if (conversions.length > 2) {
      issues.push(`Multiple conversions detected: ${conversions.length}`)
    }

    const summary = `Goal ${goalId}: ${operations.length} operations, ${issues.length} potential issues`

    return {
      operations,
      summary,
      issues
    }
  }

  generateReport(): string {
    const report: string[] = []
    report.push('=== GOAL OPERATIONS ANALYSIS REPORT ===')
    report.push(`Generated: ${new Date().toISOString()}`)
    report.push(`Total logs: ${this.logs.length}`)
    report.push('')

    // Operation breakdown
    const operationCounts = this.logs.reduce((acc, log) => {
      acc[log.operation] = (acc[log.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    report.push('Operation Breakdown:')
    Object.entries(operationCounts).forEach(([op, count]) => {
      report.push(`  ${op}: ${count}`)
    })
    report.push('')

    // Recent errors
    const recentErrors = this.getLogsByOperation('ERROR').slice(0, 5)
    if (recentErrors.length > 0) {
      report.push('Recent Errors:')
      recentErrors.forEach((error, i) => {
        report.push(`  ${i + 1}. ${error.timestamp}: ${error.error?.message}`)
        if (error.context) {
          report.push(`     Context: ${error.context}`)
        }
      })
      report.push('')
    }

    // Goal-specific analysis for goals with issues
    const goalIds = Array.from(new Set(this.logs.map(log => log.goalId).filter(Boolean)))
    const problematicGoals = goalIds.map(goalId => this.analyzeGoalOperations(goalId!))
                                   .filter(analysis => analysis.issues.length > 0)

    if (problematicGoals.length > 0) {
      report.push('Goals with Issues:')
      problematicGoals.forEach(analysis => {
        report.push(`  ${analysis.summary}`)
        analysis.issues.forEach(issue => {
          report.push(`    - ${issue}`)
        })
      })
    }

    return report.join('\n')
  }

  // Export logs for external analysis
  exportLogs(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    }, null, 2)
  }

  clearLogs() {
    this.logs = []
    console.log('[GOAL_LOGGER] Logs cleared')
  }
}

// Global logger instance
export const goalLogger = new GoalLogger()

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).goalLogger = goalLogger
}