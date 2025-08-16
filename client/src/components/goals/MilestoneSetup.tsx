import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { MilestonesService } from "@/lib/services/milestones"
import { Goal, Milestone } from "@/types/goals"
import { Target, Plus, Trash2, Calendar, Weight, CheckCircle, Circle, Lightbulb } from "lucide-react"

interface MilestoneSetupProps {
  goal: Goal
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

// Pre-built business milestone templates
const MILESTONE_TEMPLATES: Record<string, {
  description: string
  color: string
  milestones: Array<{
    name: string
    description: string
    weight: number
    order: number
  }>
}> = {
  "Product Launch": {
    description: "Complete product development and market launch",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    milestones: [
      { name: "Market Research & Validation", description: "Validate product-market fit and target audience", weight: 15, order: 1 },
      { name: "Technical Architecture", description: "Design and plan technical implementation", weight: 20, order: 2 },
      { name: "MVP Development", description: "Build minimum viable product", weight: 30, order: 3 },
      { name: "Beta Testing", description: "Test with select users and gather feedback", weight: 15, order: 4 },
      { name: "Go-to-Market Strategy", description: "Plan marketing and launch execution", weight: 10, order: 5 },
      { name: "Public Launch", description: "Official product release and promotion", weight: 10, order: 6 }
    ]
  },
  "Business Expansion": {
    description: "Scale business operations to new markets or segments",
    color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    milestones: [
      { name: "Market Analysis", description: "Research new market opportunities and competition", weight: 20, order: 1 },
      { name: "Resource Planning", description: "Secure necessary resources and funding", weight: 15, order: 2 },
      { name: "Team Scaling", description: "Hire and train key personnel", weight: 25, order: 3 },
      { name: "Infrastructure Setup", description: "Establish operational systems and processes", weight: 20, order: 4 },
      { name: "Pilot Program", description: "Test expansion strategy with limited scope", weight: 15, order: 5 },
      { name: "Full Rollout", description: "Complete market entry and operations", weight: 5, order: 6 }
    ]
  },
  "Skill Mastery": {
    description: "Master a new professional or business skill",
    color: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800", 
    milestones: [
      { name: "Foundation Learning", description: "Study fundamentals and core concepts", weight: 25, order: 1 },
      { name: "Practical Application", description: "Apply skills in real projects", weight: 30, order: 2 },
      { name: "Advanced Techniques", description: "Learn advanced methods and best practices", weight: 20, order: 3 },
      { name: "Peer Learning", description: "Learn from others and share knowledge", weight: 10, order: 4 },
      { name: "Mastery Demonstration", description: "Prove proficiency through real results", weight: 15, order: 5 }
    ]
  },
  "E-commerce Store": {
    description: "Launch and optimize an online store",
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    milestones: [
      { name: "Store Setup", description: "Configure platform and basic settings", weight: 15, order: 1 },
      { name: "Product Catalog", description: "Add products, photos, and descriptions", weight: 25, order: 2 },
      { name: "Payment & Shipping", description: "Setup payment processing and shipping", weight: 20, order: 3 },
      { name: "Marketing Launch", description: "Launch marketing campaigns and SEO", weight: 25, order: 4 },
      { name: "Optimization", description: "Analyze and optimize for conversions", weight: 15, order: 5 }
    ]
  },
  "Health & Fitness": {
    description: "Achieve health and fitness goals systematically",
    color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
    milestones: [
      { name: "Goal Setting & Planning", description: "Define specific health goals and create plan", weight: 10, order: 1 },
      { name: "Routine Establishment", description: "Build consistent exercise and nutrition habits", weight: 30, order: 2 },
      { name: "Progress Tracking", description: "Monitor and measure improvements", weight: 20, order: 3 },
      { name: "Milestone Achievements", description: "Reach intermediate fitness targets", weight: 30, order: 4 },
      { name: "Lifestyle Integration", description: "Make healthy habits permanent", weight: 10, order: 5 }
    ]
  }
}

export function MilestoneSetup({ goal, open, onOpenChange, onComplete }: MilestoneSetupProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customMilestones, setCustomMilestones] = useState<Array<{
    name: string
    description: string
    weight: number
    order: number
  }>>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    weight: 10
  })

  const createMilestonesMutation = useMutation({
    mutationFn: async (milestones: Array<{name: string, description: string, weight: number, order: number}>) => {
      const milestoneData = milestones.map(milestone => ({
        goal_id: goal.id,
        title: milestone.name,
        description: milestone.description,
        weight: milestone.weight,
        order_index: milestone.order,
        completed: false,
        due_date: null
      }))
      
      return await MilestonesService.createMultipleMilestones(milestoneData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['milestones', goal.id] })
      toast({
        title: "Milestones Created",
        description: "Your milestone plan has been set up successfully!",
      })
      onComplete()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error creating milestones:', error)
      toast({
        title: "Error",
        description: "Failed to create milestones. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName)
    setCustomMilestones([])
    setShowCustomForm(false)
  }

  const handleCustomMode = () => {
    setSelectedTemplate(null)
    setCustomMilestones([])
    setShowCustomForm(true)
  }

  const addCustomMilestone = () => {
    if (!newMilestone.name.trim()) return

    const milestone = {
      ...newMilestone,
      order: customMilestones.length + 1
    }
    
    setCustomMilestones(prev => [...prev, milestone])
    setNewMilestone({ name: '', description: '', weight: 10 })
  }

  const removeCustomMilestone = (index: number) => {
    setCustomMilestones(prev => prev.filter((_, i) => i !== index))
  }

  const getTotalWeight = () => {
    if (selectedTemplate) {
      return MILESTONE_TEMPLATES[selectedTemplate].milestones.reduce((sum: number, m: any) => sum + m.weight, 0)
    }
    return customMilestones.reduce((sum: number, m: any) => sum + m.weight, 0)
  }

  const getMilestonesToCreate = () => {
    if (selectedTemplate) {
      return MILESTONE_TEMPLATES[selectedTemplate].milestones
    }
    return customMilestones
  }

  const handleCreateMilestones = () => {
    const milestones = getMilestonesToCreate()
    if (milestones.length === 0) {
      toast({
        title: "No Milestones",
        description: "Please select a template or add custom milestones.",
        variant: "destructive",
      })
      return
    }

    createMilestonesMutation.mutate(milestones)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Setup Milestones for "{goal.title}"
          </DialogTitle>
          <DialogDescription>
            Break down your goal into actionable milestones. Choose a pre-built template or create custom milestones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Choose Milestone Plan</h3>
              <Button
                variant={showCustomForm ? "default" : "outline"}
                size="sm"
                onClick={handleCustomMode}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Custom Milestones
              </Button>
            </div>

            {/* Pre-built Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(MILESTONE_TEMPLATES).map(([name, template]) => (
                <Card
                  key={name}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTemplate === name 
                      ? 'ring-2 ring-orange-600 bg-orange-50 dark:bg-orange-950' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => handleTemplateSelect(name)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {name}
                      <Badge variant="outline">{template.milestones.length} steps</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {template.milestones.slice(0, 3).map((milestone, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Circle className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">
                            {milestone.name}
                          </span>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {milestone.weight}%
                          </Badge>
                        </div>
                      ))}
                      {template.milestones.length > 3 && (
                        <div className="text-xs text-slate-500 pl-5">
                          +{template.milestones.length - 3} more milestones
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Milestone Form */}
          {showCustomForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Create Custom Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="milestone-name">Milestone Name</Label>
                    <Input
                      id="milestone-name"
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Complete market research"
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestone-description">Description</Label>
                    <Input
                      id="milestone-description"
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestone-weight">Weight (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="milestone-weight"
                        type="number"
                        min="1"
                        max="100"
                        value={newMilestone.weight}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                      />
                      <Button onClick={addCustomMilestone} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Custom Milestones List */}
                {customMilestones.length > 0 && (
                  <div className="space-y-2">
                    <Label>Created Milestones</Label>
                    {customMilestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">{milestone.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{milestone.weight}%</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomMilestone(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <Card className={MILESTONE_TEMPLATES[selectedTemplate].color}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  {selectedTemplate} Plan
                  <Badge variant="outline">
                    {MILESTONE_TEMPLATES[selectedTemplate].milestones.length} milestones
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {MILESTONE_TEMPLATES[selectedTemplate].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MILESTONE_TEMPLATES[selectedTemplate].milestones.map((milestone: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-900/50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                      <div>
                        <div className="font-medium">{milestone.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{milestone.description}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{milestone.weight}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Weight Validation */}
          {(selectedTemplate || customMilestones.length > 0) && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label>Total Weight</Label>
                <Badge variant={getTotalWeight() === 100 ? "default" : "destructive"}>
                  {getTotalWeight()}%
                </Badge>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(getTotalWeight(), 100)}%` }}
                />
              </div>
              {getTotalWeight() !== 100 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Milestone weights should total 100% for accurate progress calculation
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMilestonesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMilestones}
              disabled={createMilestonesMutation.isPending || getTotalWeight() !== 100}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {createMilestonesMutation.isPending ? "Creating..." : "Create Milestones"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}