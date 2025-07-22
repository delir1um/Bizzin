import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLocation } from "wouter"
import { useAuth } from "@/hooks/AuthProvider"
import { CalendarDays, Notebook, File, PlayCircle } from "lucide-react"

export function DashboardPage() {
  const { user } = useAuth()
  const [, setLocation] = useLocation()
  
  const navigate = (path: string) => setLocation(path)

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.email?.split('@')[0] ?? "Entrepreneur"}!</h1>
        <p className="text-muted-foreground mt-1">Plan. Track. Grow.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">2</p>
            <p className="text-sm text-muted-foreground">Active this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">3</p>
            <p className="text-sm text-muted-foreground">Entries this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={40} />
            <p className="text-sm text-muted-foreground mt-2">40% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DocSafe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">12</p>
            <p className="text-sm text-muted-foreground">Files uploaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => navigate("/goals")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Add a New Goal</CardTitle>
            <CalendarDays className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Define a new business objective</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => navigate("/journal")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Write Journal Entry</CardTitle>
            <Notebook className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Capture today’s insights</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => navigate("/training")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Continue Training</CardTitle>
            <PlayCircle className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Pick up where you left off</p>
          </CardContent>
        </Card>
      </div>

      {/* Optional Onboarding Message */}
      <Card className="bg-muted/50 border-dashed border-2 border-muted">
        <CardContent className="py-6 flex flex-col items-center justify-center text-center space-y-4">
          <File className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm max-w-md">
            New to Bizzin? Watch the short demo or explore your tools to get started confidently.
          </p>
          <div className="flex space-x-2">
            <Button variant="default">Watch Demo</Button>
            <Button variant="outline">Explore Features</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
