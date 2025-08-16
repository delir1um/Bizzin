import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { goalLogger } from '@/lib/logger'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export const LoggerDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState(goalLogger.getAllLogs())
  const [isVisible, setIsVisible] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')

  useEffect(() => {
    // Refresh logs every 2 seconds
    const interval = setInterval(() => {
      setLogs(goalLogger.getAllLogs())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const exportLogs = () => {
    const dataStr = goalLogger.exportLogs()
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `goal_logs_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const generateReport = () => {
    const report = goalLogger.generateReport()
    console.log('=== GOAL OPERATIONS REPORT ===')
    console.log(report)
    
    // Also copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
      console.log('Report copied to clipboard!')
    })
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'CONVERT': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'ERROR': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsVisible(true)} variant="outline" size="sm">
          📊 Debug Logs ({logs.length})
        </Button>
      </div>
    )
  }

  const filteredLogs = selectedGoalId 
    ? logs.filter(log => log.goalId === selectedGoalId)
    : logs

  const uniqueGoalIds = Array.from(new Set(logs.map(log => log.goalId).filter(Boolean)))

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Goal Operations Log</h3>
          <div className="flex gap-1">
            <Button onClick={generateReport} size="sm" variant="outline" className="text-xs px-2 h-6">
              Report
            </Button>
            <Button onClick={exportLogs} size="sm" variant="outline" className="text-xs px-2 h-6">
              Export
            </Button>
            <Button onClick={() => goalLogger.clearLogs()} size="sm" variant="outline" className="text-xs px-2 h-6">
              Clear
            </Button>
            <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost" className="text-xs px-2 h-6">
              ✕
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="w-full p-1 text-xs border rounded"
          >
            <option value="">All Goals</option>
            {uniqueGoalIds.map(goalId => (
              <option key={goalId} value={goalId}>Goal: {goalId?.slice(-8)}</option>
            ))}
          </select>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {filteredLogs.slice(0, 50).map((log, index) => (
              <div key={index} className="text-xs border-l-2 border-gray-200 pl-2">
                <div className="flex justify-between items-start mb-1">
                  <Badge className={`text-xs px-2 py-1 ${getOperationColor(log.operation)}`}>
                    {log.operation}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {log.goalId && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Goal: {log.goalId.slice(-8)}
                  </div>
                )}
                
                {log.context && (
                  <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                    {log.context}
                  </div>
                )}
                
                {log.error && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/10 p-1 rounded">
                    {log.error.message}
                  </div>
                )}
                
                {log.data && Object.keys(log.data).length > 0 && (
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer text-gray-500">Data</summary>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-4">
                No logs available
              </div>
            )}
            
            {filteredLogs.length > 50 && (
              <div className="text-xs text-gray-500 text-center py-2">
                Showing latest 50 entries ({filteredLogs.length} total)
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}