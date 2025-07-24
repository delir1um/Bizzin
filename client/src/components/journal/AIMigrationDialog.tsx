import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Brain, Sparkles, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { AIMigrationService } from '@/lib/services/aiMigration'
import type { JournalEntry } from '@/types/journal'

interface AIMigrationDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function AIMigrationDialog({ isOpen, onClose, onComplete }: AIMigrationDialogProps) {
  const [migrationState, setMigrationState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null)
  const [results, setResults] = useState({ success: 0, failed: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const startMigration = async () => {
    setMigrationState('running')
    setError(null)
    setResults({ success: 0, failed: 0, total: 0 })

    try {
      const migrationResults = await AIMigrationService.migrateAllEntries(
        (current, total, entry) => {
          setProgress({ current, total })
          setCurrentEntry(entry)
        }
      )
      
      setResults(migrationResults)
      setMigrationState('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed')
      setMigrationState('error')
    }
  }

  const handleComplete = () => {
    onComplete()
    onClose()
    setMigrationState('idle')
    setProgress({ current: 0, total: 0 })
    setCurrentEntry(null)
    setError(null)
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Brain className="w-5 h-5" />
            AI Enhancement Migration
          </DialogTitle>
          <DialogDescription>
            Update your existing journal entries with improved AI analysis for better mood detection and business insights.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-800">What will be updated?</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Enhanced AI Analysis
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-orange-700">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
              <span>More accurate mood detection using business-focused sentiment analysis</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
              <span>Better business category classification (Challenge, Strategy, Planning, etc.)</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
              <span>Enhanced business insights and pattern recognition</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
              <span>Consistent data across all your journal entries</span>
            </div>
          </CardContent>
        </Card>

        {migrationState === 'running' && (
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">Processing entries...</span>
                  <span className="text-blue-600">{progress.current} of {progress.total}</span>
                </div>
                
                <Progress value={progressPercentage} className="w-full h-2" />
                
                {currentEntry && (
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-700">Analyzing:</span>
                      <span className="text-blue-600 font-medium truncate">
                        {currentEntry.title?.substring(0, 60)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {migrationState === 'complete' && (
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Migration Complete!</div>
                  <div className="text-sm text-green-600">Your journal entries have been enhanced with improved AI analysis.</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/70 rounded-lg p-3 border border-green-200/50">
                  <div className="text-2xl font-bold text-green-700">{results.success}</div>
                  <div className="text-xs text-green-600">Updated</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-green-200/50">
                  <div className="text-2xl font-bold text-green-700">{results.total}</div>
                  <div className="text-xs text-green-600">Total</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-green-200/50">
                  <div className="text-2xl font-bold text-green-700">{results.failed}</div>
                  <div className="text-xs text-green-600">Skipped</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {migrationState === 'error' && (
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Migration Failed</div>
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          {migrationState === 'idle' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Not Now
              </Button>
              <Button onClick={startMigration} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Brain className="w-4 h-4 mr-2" />
                Start Migration
              </Button>
            </>
          )}
          
          {migrationState === 'running' && (
            <Button variant="outline" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Processing...
            </Button>
          )}
          
          {(migrationState === 'complete' || migrationState === 'error') && (
            <Button onClick={handleComplete} className="bg-orange-600 hover:bg-orange-700 text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}