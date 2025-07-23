import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  Calendar,
  BarChart3,
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { intelligentCoachingSystem, type CoachingPlan, type BusinessIntelligenceReport, type PersonalizedCoachingSession } from "@/lib/intelligentCoachingSystem"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import type { JournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"

interface IntelligentCoachingPanelProps {
  entries: JournalEntry[]
  goals: Goal[]
  className?: string
}

export function IntelligentCoachingPanel({ 
  entries, 
  goals, 
  className = "" 
}: IntelligentCoachingPanelProps) {
  const [activeTab, setActiveTab] = useState("insights")
  const [coachingPlans, setCoachingPlans] = useState<CoachingPlan[]>([])
  const [businessReport, setBusinessReport] = useState<BusinessIntelligenceReport | null>(null)
  const [coachingSession, setCoachingSession] = useState<PersonalizedCoachingSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    initializeCoaching()
  }, [entries, goals])

  const initializeCoaching = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      await intelligentCoachingSystem.initialize(user.id)

      // Generate coaching insights
      const plans = intelligentCoachingSystem.generateCoachingPlan(entries, goals)
      setCoachingPlans(plans)

      // Generate business intelligence report
      const report = intelligentCoachingSystem.generateBusinessIntelligenceReport(entries, goals, 'weekly')
      setBusinessReport(report)

    } catch (error) {
      console.error('Error initializing intelligent coaching:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startCoachingSession = (type: PersonalizedCoachingSession['type']) => {
    const session = intelligentCoachingSystem.generatePersonalizedCoachingSession(type)
    setCoachingSession(session)
    setActiveTab("session")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strategic': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'operational': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'emotional': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'growth': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      case 'stable': return <BarChart3 className="w-4 h-4 text-blue-600" />
      case 'volatile': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"
              >
                <Brain className="w-4 h-4 text-orange-600" />
              </motion.div>
              <span className="text-sm text-slate-600">
                AI Business Coach is analyzing your patterns...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-600" />
            Intelligent Business Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="plans">Coaching Plans</TabsTrigger>
              <TabsTrigger value="health">Business Health</TabsTrigger>
              <TabsTrigger value="session">Coaching Session</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4 mt-6">
              {businessReport && (
                <>
                  {/* Key Insights */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-orange-600" />
                      Key Insights
                    </h3>
                    {businessReport.keyInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <p className="text-sm text-slate-800">{insight}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Trend Analysis */}
                  {businessReport.trendAnalysis.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        Trend Analysis
                      </h3>
                      {businessReport.trendAnalysis.map((trend, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start gap-3">
                            {getTrendIcon(trend.trend)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium capitalize">{trend.type}</span>
                                <Badge variant="outline" className={
                                  trend.trend === 'improving' ? 'border-green-200 text-green-700' :
                                  trend.trend === 'declining' ? 'border-red-200 text-red-700' :
                                  'border-blue-200 text-blue-700'
                                }>
                                  {trend.trend}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{trend.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {businessReport.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        Recommendations
                      </h3>
                      {businessReport.recommendations.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <p className="text-sm text-slate-800">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="plans" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personalized Coaching Plans</h3>
                <Badge className="bg-orange-100 text-orange-700">
                  {coachingPlans.length} Active Plans
                </Badge>
              </div>

              {coachingPlans.length === 0 ? (
                <Card className="p-6 text-center">
                  <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    Keep journaling to unlock personalized coaching plans
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {coachingPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">{plan.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(plan.priority)}>
                              {plan.priority}
                            </Badge>
                            <Badge className={getCategoryColor(plan.category)}>
                              {plan.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {plan.timeframe}
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {Math.round(plan.confidence * 100)}% confidence
                          </span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Action Items:</span>
                          {plan.actionItems.map((action, actionIndex) => (
                            <div key={action.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                              <CheckCircle className={`w-4 h-4 ${action.completed ? 'text-green-600' : 'text-slate-300'}`} />
                              <span className={`text-sm ${action.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                                {action.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="health" className="space-y-4 mt-6">
              {businessReport && (
                <>
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-8 border-slate-200"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-8 border-orange-500 transition-all duration-1000"
                        style={{
                          borderRightColor: 'transparent',
                          borderBottomColor: 'transparent',
                          transform: `rotate(${(businessReport.businessHealth.score / 100) * 360 - 90}deg)`
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">
                          {businessReport.businessHealth.score}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">Business Health Score</h3>
                    <p className="text-slate-600">Overall assessment of your business progress</p>
                  </div>

                  <div className="space-y-4">
                    {businessReport.businessHealth.factors.map((factor, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">{factor.name}</span>
                          <span className="text-sm text-slate-600">{Math.round(factor.score)}/100</span>
                        </div>
                        <Progress value={factor.score} className="mb-2" />
                        <p className="text-sm text-slate-600">{factor.description}</p>
                      </motion.div>
                    ))}
                  </div>

                  {businessReport.riskFactors.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Risk Factors
                      </h4>
                      {businessReport.riskFactors.map((risk, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{risk}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {businessReport.opportunities.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-700 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Opportunities
                      </h4>
                      {businessReport.opportunities.map((opp, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">{opp}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="session" className="space-y-4 mt-6">
              {!coachingSession ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Start a Coaching Session</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => startCoachingSession('weekly-review')}
                      className="h-auto p-4 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-medium">Weekly Review</div>
                        <div className="text-sm text-slate-500">Reflect on progress and plan ahead</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => startCoachingSession('challenge-solving')}
                      className="h-auto p-4 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-medium">Challenge Solving</div>
                        <div className="text-sm text-slate-500">Work through current obstacles</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => startCoachingSession('goal-planning')}
                      className="h-auto p-4 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-medium">Goal Planning</div>
                        <div className="text-sm text-slate-500">Set strategic objectives</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => startCoachingSession('crisis-support')}
                      className="h-auto p-4 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-medium">Crisis Support</div>
                        <div className="text-sm text-slate-500">Get immediate guidance</div>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{coachingSession.focus}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoachingSession(null)}
                    >
                      End Session
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                      Coaching Questions
                    </h4>
                    {coachingSession.questions.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <p className="text-slate-800 mb-3">{question}</p>
                        <div className="min-h-[80px] p-3 bg-white rounded border border-slate-200">
                          <p className="text-sm text-slate-400">Click here to reflect and write your thoughts...</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Follow-up scheduled</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Next session: {new Date(coachingSession.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}