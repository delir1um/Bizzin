import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { ScrollArea } from "@/components/ui/scroll-area" // Commented out as it might not be available
import { useToast } from "@/hooks/use-toast"
import { MilestonesService } from "@/lib/services/milestones"
import { Layout, Clock, Briefcase, GraduationCap, Heart, ShoppingCart, Building } from "lucide-react"

interface MilestoneTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  milestones: {
    title: string
    description: string
    weight: number
  }[]
}

const milestoneTemplates: MilestoneTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Complete product development and market launch',
    category: 'Business',
    icon: Briefcase,
    milestones: [
      {
        title: 'Market research and validation',
        description: 'Analyze target market, competitors, and validate product concept',
        weight: 1
      },
      {
        title: 'MVP development',
        description: 'Build minimum viable product with core features',
        weight: 3
      },
      {
        title: 'Beta testing and feedback',
        description: 'Conduct user testing and gather feedback for improvements',
        weight: 2
      },
      {
        title: 'Production-ready development',
        description: 'Finalize product features and prepare for scale',
        weight: 2
      },
      {
        title: 'Marketing and sales preparation',
        description: 'Create marketing materials, pricing strategy, and sales funnel',
        weight: 1
      },
      {
        title: 'Launch and distribution',
        description: 'Execute launch strategy and establish distribution channels',
        weight: 1
      }
    ]
  },
  {
    id: 'business-expansion',
    name: 'Business Expansion',
    description: 'Scale operations to new markets or segments',
    category: 'Business',
    icon: Building,
    milestones: [
      {
        title: 'Market opportunity analysis',
        description: 'Research new markets and expansion opportunities',
        weight: 1
      },
      {
        title: 'Business plan development',
        description: 'Create detailed expansion strategy and financial projections',
        weight: 1
      },
      {
        title: 'Funding and resources',
        description: 'Secure necessary capital and resources for expansion',
        weight: 2
      },
      {
        title: 'Team scaling and hiring',
        description: 'Recruit and onboard additional team members',
        weight: 2
      },
      {
        title: 'Infrastructure and systems',
        description: 'Establish operational infrastructure for new markets',
        weight: 2
      },
      {
        title: 'Launch in new market',
        description: 'Execute expansion and establish market presence',
        weight: 2
      }
    ]
  },
  {
    id: 'skill-mastery',
    name: 'Skill Mastery',
    description: 'Master a new professional or personal skill',
    category: 'Learning',
    icon: GraduationCap,
    milestones: [
      {
        title: 'Foundation learning',
        description: 'Complete basic courses and understand fundamentals',
        weight: 1
      },
      {
        title: 'Practical application',
        description: 'Apply skills in real projects or scenarios',
        weight: 2
      },
      {
        title: 'Advanced concepts',
        description: 'Study advanced topics and complex applications',
        weight: 2
      },
      {
        title: 'Portfolio development',
        description: 'Create portfolio showcasing skill proficiency',
        weight: 1
      },
      {
        title: 'Peer review and feedback',
        description: 'Get feedback from experts and peers in the field',
        weight: 1
      },
      {
        title: 'Certification or validation',
        description: 'Obtain formal certification or professional recognition',
        weight: 1
      }
    ]
  },
  {
    id: 'health-fitness',
    name: 'Health & Fitness Journey',
    description: 'Achieve specific health and fitness goals',
    category: 'Health',
    icon: Heart,
    milestones: [
      {
        title: 'Health assessment and goal setting',
        description: 'Complete health evaluation and set specific targets',
        weight: 1
      },
      {
        title: 'Nutrition plan implementation',
        description: 'Develop and follow a structured nutrition plan',
        weight: 2
      },
      {
        title: 'Exercise routine establishment',
        description: 'Create and maintain consistent workout schedule',
        weight: 2
      },
      {
        title: 'Progress tracking and adjustments',
        description: 'Monitor progress and adjust plan as needed',
        weight: 1
      },
      {
        title: 'Habit formation',
        description: 'Establish long-term healthy lifestyle habits',
        weight: 2
      },
      {
        title: 'Goal achievement and maintenance',
        description: 'Reach target goals and create maintenance plan',
        weight: 2
      }
    ]
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store Launch',
    description: 'Build and launch a successful online store',
    category: 'Business',
    icon: ShoppingCart,
    milestones: [
      {
        title: 'Product and niche selection',
        description: 'Research and validate product ideas and target market',
        weight: 1
      },
      {
        title: 'Store setup and design',
        description: 'Create website, branding, and user experience',
        weight: 2
      },
      {
        title: 'Payment and logistics setup',
        description: 'Configure payment processing and shipping systems',
        weight: 1
      },
      {
        title: 'Inventory and supplier management',
        description: 'Establish supplier relationships and inventory systems',
        weight: 2
      },
      {
        title: 'Marketing and customer acquisition',
        description: 'Develop marketing strategy and launch campaigns',
        weight: 2
      },
      {
        title: 'Order fulfillment optimization',
        description: 'Optimize operations and customer service processes',
        weight: 2
      }
    ]
  }
]

interface MilestoneTemplatesProps {
  goalId: string
  onTemplateApplied: () => void
}

export function MilestoneTemplates({ goalId, onTemplateApplied }: MilestoneTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isApplying, setIsApplying] = useState<string | null>(null)
  const { toast } = useToast()

  const applyTemplate = async (template: MilestoneTemplate) => {
    setIsApplying(template.id)
    
    try {
      // Create milestones from template
      for (let i = 0; i < template.milestones.length; i++) {
        const milestone = template.milestones[i]
        await MilestonesService.createMilestone({
          goal_id: goalId,
          title: milestone.title,
          description: milestone.description,
          weight: milestone.weight,
          order_index: i,
          status: 'todo'
        })
      }
      
      toast({
        title: "Template Applied",
        description: `Successfully added ${template.milestones.length} milestones from "${template.name}" template.`,
      })
      
      onTemplateApplied()
      setIsOpen(false)
      
    } catch (error) {
      console.error('Error applying template:', error)
      toast({
        title: "Error",
        description: "Failed to apply template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsApplying(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
          <Layout className="w-4 h-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Milestone Templates</DialogTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose a template to quickly add structured milestones to your goal
          </p>
        </DialogHeader>
        
        <div className="h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
            {milestoneTemplates.map((template) => {
              const IconComponent = template.icon
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <IconComponent className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Includes {template.milestones.length} milestones:
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {template.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {milestone.title}
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 text-xs">
                                {milestone.description}
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {milestone.weight}x
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => applyTemplate(template)}
                        disabled={isApplying === template.id}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {isApplying === template.id ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Layout className="w-4 h-4 mr-2" />
                            Apply Template
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}