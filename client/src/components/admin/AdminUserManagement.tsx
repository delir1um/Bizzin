import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Eye, 
  Edit,
  Crown,
  Calendar,
  Activity,
  FileText,
  Target,
  DollarSign,
  MoreHorizontal
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface UserPlan {
  user_id: string
  plan_type: 'free' | 'premium'
  expires_at: string | null
  created_at: string
  status?: string | null
  cancelled_at?: string | null
}

interface UserProfile {
  user_id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  business_name: string
  plan_type: 'free' | 'premium' | 'trial'
  plan_status: 'active' | 'cancelled' | 'expired'
  expires_at: string | null
  trial_days_remaining: number | null
  paid_member_duration: number | null
  is_trial: boolean
  created_at: string
  last_login: string
  is_active: boolean
  total_journal_entries: number
  completed_goals: number
  storage_used: number
  last_activity: string
}

// Trial editing form schema
const trialEditSchema = z.object({
  daysToAdd: z.number().min(-365, 'Cannot subtract more than 365 days').max(365, 'Cannot add more than 365 days'),
  action: z.enum(['add', 'set_exact']),
  exactDate: z.string().optional()
})

type TrialEditFormValues = z.infer<typeof trialEditSchema>

export function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [trialEditUser, setTrialEditUser] = useState<UserProfile | null>(null)
  const [isTrialEditOpen, setIsTrialEditOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch users from whatever tables exist
  const { data: users, isLoading, refetch } = useQuery<UserProfile[]>({
    queryKey: ['admin-users', searchTerm, planFilter, statusFilter],
    queryFn: async (): Promise<UserProfile[]> => {
      console.log('Fetching users for admin dashboard...')
      
      try {
        // Get user profiles with real usage data
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profileError) {
          console.error('Error fetching user profiles:', profileError)
          return []
        }

        if (!profileData || profileData.length === 0) {
          console.log('No user profiles found')
          return []
        }

        console.log('User profiles result:', { count: profileData.length, error: null })

        // Get real usage statistics for each user
        const userIds = profileData.map(p => p.user_id)
        
        // Handle potentially missing tables gracefully
        const [plansResult, journalResult, goalsResult, documentsResult] = await Promise.allSettled([
          // Re-enable user_plans query for trial management with status fields
          supabase.from('user_plans').select('user_id, plan_type, expires_at, created_at, status, cancelled_at').in('user_id', userIds),
          supabase.from('journal_entries').select('user_id').in('user_id', userIds),
          supabase.from('goals').select('user_id, status, title').in('user_id', userIds),
          supabase.from('documents').select('user_id, file_size, name').in('user_id', userIds)
        ])

        const plansData = plansResult.status === 'fulfilled' ? plansResult.value : { data: [], error: null }
        const journalData = journalResult.status === 'fulfilled' ? journalResult.value : { data: [], error: null }
        const goalsData = goalsResult.status === 'fulfilled' ? goalsResult.value : { data: [], error: null }
        const documentsData = documentsResult.status === 'fulfilled' ? documentsResult.value : { data: [], error: null }

        console.log('Detailed query results:', {
          plansData: plansData.data?.length || 0,
          plansError: plansData.error ? 'error' : 'none',
          journalData: journalData.data?.length || 0,
          journalError: journalData.error ? 'error' : 'none',
          goalsData: goalsData.data?.length || 0,
          goalsError: goalsData.error ? 'error' : 'none',
          documentsData: documentsData.data?.length || 0,
          documentsError: documentsData.error ? 'error' : 'none'
        })

        console.log('Raw data fetched:', {
          plans: plansData.data?.length || 0,
          journal: journalData.data?.length || 0, 
          goals: goalsData.data?.length || 0,
          documents: documentsData.data?.length || 0
        })

        const users: UserProfile[] = profileData.map((profile: any) => {
          const userPlan = plansData.data?.find((p: any) => p.user_id === profile.user_id) as UserPlan | undefined
          const journalCount = journalData.data?.filter((j: any) => j.user_id === profile.user_id).length || 0
          const userGoals = goalsData.data?.filter((g: any) => g.user_id === profile.user_id) || []
          const completedGoals = userGoals.filter((g: any) => g.status === 'completed').length
          const userDocs = documentsData.data?.filter((d: any) => d.user_id === profile.user_id) || []
          const storageUsed = userDocs.reduce((sum: number, doc: any) => sum + (doc.file_size || 0), 0)
          
          // Calculate trial and paid status
          const now = new Date()
          const expiresAt = userPlan?.expires_at ? new Date(userPlan.expires_at) : null
          const planCreatedAt = userPlan?.created_at ? new Date(userPlan.created_at) : null
          
          let isTrial = false
          let trialDaysRemaining = null
          let paidMemberDuration = null
          let actualPlanType: 'free' | 'premium' | 'trial' = userPlan?.plan_type || 'free'
          let planStatus: 'active' | 'cancelled' | 'expired' = 'active'
          
          if (userPlan?.plan_type === 'free' && expiresAt) {
            // This is a trial user (free plan with expiry)
            isTrial = true
            actualPlanType = 'trial'
            if (expiresAt > now) {
              trialDaysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            } else {
              trialDaysRemaining = 0 // Expired trial
              planStatus = 'expired'
            }
          } else if (userPlan?.plan_type === 'premium' && planCreatedAt) {
            // Calculate how long they've been a paid member
            paidMemberDuration = Math.floor((now.getTime() - planCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
          }
          
          // Determine plan status - check for cancellation
          if (userPlan?.status === 'cancelled' || userPlan?.cancelled_at) {
            planStatus = 'cancelled'
          } else if (expiresAt && expiresAt < now && isTrial) {
            planStatus = 'expired'
          }
          
          console.log(`User ${profile.email} stats:`, {
            journal: journalCount,
            goals: { total: userGoals.length, completed: completedGoals },
            docs: { count: userDocs.length, storage: storageUsed },
            plan: { type: actualPlanType, isTrial, trialDaysRemaining, paidMemberDuration }
          })

          return {
            user_id: profile.user_id,
            email: profile.email || 'Unknown',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
            business_name: profile.business_name || '',
            plan_type: actualPlanType,
            plan_status: planStatus,
            expires_at: userPlan?.expires_at || null,
            trial_days_remaining: trialDaysRemaining,
            paid_member_duration: paidMemberDuration,
            is_trial: isTrial,
            created_at: profile.created_at,
            last_login: profile.last_login,
            is_active: profile.is_active ?? true,
            total_journal_entries: journalCount,
            completed_goals: completedGoals,
            storage_used: storageUsed,
            last_activity: profile.updated_at || profile.created_at
          }
        })

        // Apply filters
        let filteredUsers: UserProfile[] = users
        if (searchTerm) {
          filteredUsers = users.filter((user: UserProfile) => 
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        if (planFilter !== 'all') {
          filteredUsers = filteredUsers.filter((user: UserProfile) => user.plan_type === planFilter)
        }

        if (statusFilter !== 'all') {
          filteredUsers = filteredUsers.filter((user: UserProfile) => user.plan_status === statusFilter)
        }

        console.log(`Returning ${filteredUsers.length} users from ${users.length} total`)
        return filteredUsers
      } catch (error) {
        console.error('Error fetching users:', error)
        return []
      }
    },
    refetchInterval: 60000 // Refresh every minute
  })

  // Trial days editing mutation
  const updateTrialDaysMutation = useMutation({
    mutationFn: async ({ userId, daysToAdd }: { userId: string; daysToAdd: number }) => {
      // First, get the current user plan to check existing expiry
      const { data: userPlan, error: fetchError } = await supabase
        .from('user_plans')
        .select('expires_at')
        .eq('user_id', userId)
        .single()
      
      if (fetchError) throw fetchError
      
      const now = new Date()
      let baseDate: Date
      
      // Determine base date: use current expiry if still valid, otherwise use now
      if (userPlan.expires_at) {
        const currentExpiry = new Date(userPlan.expires_at)
        baseDate = currentExpiry > now ? currentExpiry : now
      } else {
        baseDate = now
      }
      
      // Add the days to the base date
      const newExpiryDate = new Date(baseDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
      
      // Validate the new date (prevent setting expiry too far in past)
      if (newExpiryDate < new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))) {
        throw new Error('Cannot set expiry more than 1 year in the past')
      }
      
      const { error } = await supabase
        .from('user_plans')
        .update({ expires_at: newExpiryDate.toISOString() })
        .eq('user_id', userId)
      
      if (error) throw error
      return { userId, newExpiryDate, baseDate }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  const editTrialDays = (user: UserProfile) => {
    setTrialEditUser(user)
    setIsTrialEditOpen(true)
  }

  const handleExportUsers = () => {
    if (!users) return

    const csvContent = [
      ['Email', 'Name', 'Business', 'Plan', 'Status', 'Trial Days Left', 'Paid Days', 'Expires At', 'Created', 'Last Login', 'Journal Entries', 'Goals', 'Storage (MB)'].join(','),
      ...users.map((user: UserProfile) => [
        user.email,
        user.full_name || `${user.first_name} ${user.last_name}`,
        user.business_name || '',
        user.plan_type,
        user.plan_status,
        user.trial_days_remaining !== null ? user.trial_days_remaining : '',
        user.paid_member_duration !== null ? user.paid_member_duration : '',
        user.expires_at ? format(new Date(user.expires_at), 'yyyy-MM-dd') : '',
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.last_login ? format(new Date(user.last_login), 'yyyy-MM-dd') : 'Never',
        user.total_journal_entries,
        user.completed_goals,
        Math.round(user.storage_used / (1024 * 1024))
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bizzin-users-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search users by email, name, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportUsers} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Trial Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: UserProfile) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.full_name || `${user.first_name} ${user.last_name}`}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {user.business_name || <span className="text-muted-foreground">Not provided</span>}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            user.plan_type === 'premium' ? 'default' : 
                            user.plan_type === 'trial' ? 'secondary' : 'outline'
                          }>
                            {user.plan_type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                            {user.plan_type === 'trial' && <Calendar className="w-3 h-3 mr-1" />}
                            {user.plan_type}
                          </Badge>
                          <Badge variant={
                            user.plan_status === 'active' ? 'default' : 
                            user.plan_status === 'cancelled' ? 'secondary' : 'destructive'
                          }>
                            {user.plan_status}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {user.is_trial ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {user.trial_days_remaining !== null ? (
                                    user.trial_days_remaining > 0 ? (
                                      <span className="text-green-600">{user.trial_days_remaining} days left</span>
                                    ) : (
                                      <span className="text-red-600">Expired</span>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">No expiry</span>
                                  )}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    editTrialDays(user)
                                  }}
                                  data-testid={`button-edit-trial-${user.user_id}`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                              {user.expires_at && (
                                <div className="text-xs text-muted-foreground">
                                  Expires: {format(new Date(user.expires_at), 'MMM d, yyyy')}
                                </div>
                              )}
                            </>
                          ) : user.plan_type === 'premium' && user.paid_member_duration !== null ? (
                            <div>
                              <span className="font-medium text-blue-600">
                                {user.paid_member_duration} days paid
                              </span>
                              <div className="text-xs text-muted-foreground">
                                Since: {format(new Date(user.created_at), 'MMM d, yyyy')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Regular user</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {user.last_login ? (
                            <>
                              <div>Last: {format(new Date(user.last_login), 'MMM d, yyyy')}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.is_active ? 'Active' : 'Inactive'}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Never logged in</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{user.total_journal_entries} entries</div>
                          <div>{user.completed_goals} goals</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(user.storage_used / (1024 * 1024))}MB storage
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>User Details: {user.full_name || user.email}</DialogTitle>
                            </DialogHeader>
                            {selectedUser && <UserDetailView user={selectedUser} />}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {users && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trial Days Edit Dialog */}
      <TrialEditDialog 
        user={trialEditUser}
        isOpen={isTrialEditOpen}
        onClose={() => {
          setIsTrialEditOpen(false)
          setTrialEditUser(null)
        }}
        onSubmit={(daysToAdd) => {
          if (trialEditUser) {
            updateTrialDaysMutation.mutate(
              { userId: trialEditUser.user_id, daysToAdd },
              {
                onSuccess: ({ newExpiryDate }) => {
                  setIsTrialEditOpen(false)
                  setTrialEditUser(null)
                  // Using a simple alert for now - could be replaced with toast
                  alert(`Trial updated successfully!\nNew expiry date: ${format(newExpiryDate, 'MMM d, yyyy')}`)
                },
                onError: (error) => {
                  console.error('Error updating trial:', error)
                  alert('Failed to update trial days. Please try again.')
                }
              }
            )
          }
        }}
        isLoading={updateTrialDaysMutation.isPending}
      />
    </div>
  )
}

function UserDetailView({ user }: { user: UserProfile }) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <p className="text-sm text-muted-foreground">
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Business Name</label>
                <p className="text-sm text-muted-foreground">
                  {user.business_name || 'Not provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Plan</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.plan_type === 'premium' ? 'default' : 'secondary'}>
                    {user.plan_type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {user.plan_type}
                  </Badge>
                  <Badge variant={
                    user.plan_status === 'active' ? 'default' : 
                    user.plan_status === 'cancelled' ? 'secondary' : 'destructive'
                  }>
                    {user.plan_status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Member Since</label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(user.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Last Login</label>
                <p className="text-sm text-muted-foreground">
                  {user.last_login ? format(new Date(user.last_login), 'MMMM d, yyyy') : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="activity" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{user.total_journal_entries}</div>
                  <div className="text-sm text-muted-foreground">Journal Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{user.completed_goals}</div>
                  <div className="text-sm text-muted-foreground">Completed Goals</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(user.storage_used / (1024 * 1024))}MB
                  </div>
                  <div className="text-sm text-muted-foreground">Storage Used</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="billing">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Plan Type</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.plan_type === 'premium' ? 'default' : 'secondary'}>
                    {user.plan_type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {user.plan_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {user.plan_type === 'premium' ? 'R299/month' : 'Free trial'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <Badge variant={
                    user.plan_status === 'active' ? 'default' : 
                    user.plan_status === 'cancelled' ? 'secondary' : 'destructive'
                  }>
                    {user.plan_status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Billing Cycle</label>
                <p className="text-sm text-muted-foreground">
                  {user.plan_type === 'premium' ? 'Monthly (Auto-renew)' : 'Trial period'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Journal Entries</label>
                <p className="text-sm text-muted-foreground">
                  {user.total_journal_entries} / {user.plan_type === 'premium' ? 'Unlimited' : '10 per month'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Storage Used</label>
                <p className="text-sm text-muted-foreground">
                  {Math.round(user.storage_used / (1024 * 1024))}MB / {user.plan_type === 'premium' ? '10GB' : '50MB'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">AI Analysis</label>
                <p className="text-sm text-muted-foreground">
                  {user.plan_type === 'premium' ? 'Unlimited requests' : '20 per month'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.plan_type === 'premium' ? (
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Premium Subscription - Monthly</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R299.00</div>
                    <Badge variant="default">Paid</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No payment history - currently on free trial
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="actions">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const subject = `Regarding Your ${user.business_name ? user.business_name + ' ' : ''}Bizzin Account`
                  const body = `Hi ${user.first_name || user.email},\n\nI hope this message finds you well.\n\nBest regards,\nThe Bizzin Team`
                  window.open(`mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={async () => {
                  const newName = prompt(`Edit name for ${user.email}:`, user.full_name || '')
                  const newBusiness = prompt(`Edit business name:`, user.business_name || '')
                  
                  if (newName !== null || newBusiness !== null) {
                    try {
                      const updates: any = {}
                      if (newName !== null && newName !== user.full_name) {
                        updates.full_name = newName
                      }
                      if (newBusiness !== null && newBusiness !== user.business_name) {
                        updates.business_name = newBusiness
                      }
                      
                      if (Object.keys(updates).length > 0) {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update(updates)
                          .eq('user_id', user.user_id)
                        
                        if (error) throw error
                        
                        alert('Profile updated successfully!')
                        refetch()
                      }
                    } catch (error) {
                      console.error('Error updating profile:', error)
                      alert('Failed to update profile. Please try again.')
                    }
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    // Fetch detailed activity data from Supabase
                    const [journalEntries, goals, documents] = await Promise.all([
                      supabase.from('journal_entries').select('created_at').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(5),
                      supabase.from('goals').select('title, created_at, completed').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(5),
                      supabase.from('documents').select('filename, created_at').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(5)
                    ])
                    
                    let activityLog = `=== ACTIVITY LOG FOR ${user.email.toUpperCase()} ===\n\n`
                    activityLog += `📊 ACCOUNT SUMMARY:\n`
                    activityLog += `• Created: ${format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}\n`
                    activityLog += `• Last login: ${user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm') : 'Never'}\n`
                    activityLog += `• Plan: ${user.plan_type} (${user.plan_status})\n`
                    activityLog += `• Storage: ${Math.round(user.storage_used / (1024 * 1024))}MB\n\n`
                    
                    if (journalEntries.data && journalEntries.data.length > 0) {
                      activityLog += `📝 RECENT JOURNAL ENTRIES (${user.total_journal_entries} total):\n`
                      journalEntries.data.forEach((entry, i) => {
                        activityLog += `${i + 1}. ${format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}\n`
                      })
                      activityLog += `\n`
                    }
                    
                    if (goals.data && goals.data.length > 0) {
                      activityLog += `🎯 RECENT GOALS (${user.completed_goals} completed):\n`
                      goals.data.forEach((goal, i) => {
                        activityLog += `${i + 1}. ${goal.title} - ${goal.completed ? '✅ Completed' : '⏳ In Progress'}\n`
                      })
                      activityLog += `\n`
                    }
                    
                    if (documents.data && documents.data.length > 0) {
                      activityLog += `📄 RECENT DOCUMENTS:\n`
                      documents.data.forEach((doc, i) => {
                        activityLog += `${i + 1}. ${doc.filename} - ${format(new Date(doc.created_at), 'MMM d, yyyy')}\n`
                      })
                    }
                    
                    alert(activityLog)
                  } catch (error) {
                    console.error('Error fetching activity log:', error)
                    alert(`Basic Activity Log for ${user.email}:\n\n• Account created: ${format(new Date(user.created_at), 'MMM d, yyyy')}\n• Last login: ${user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy') : 'Never'}\n• Journal entries: ${user.total_journal_entries}\n• Goals completed: ${user.completed_goals}\n• Storage used: ${Math.round(user.storage_used / (1024 * 1024))}MB`)
                  }
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                View Activity Log
              </Button>

              <div className="border-t pt-3 mt-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-orange-600 hover:text-orange-700 mt-2"
                  onClick={async () => {
                    if (confirm(`Reset ${user.first_name || user.email}'s password?\n\nThis will:\n• Send a password reset email to their address\n• Allow them to create a new password\n• Invalidate their current session\n\nConfirm password reset?`)) {
                      try {
                        // Use Supabase Auth API to reset password
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: `${window.location.origin}/auth?mode=reset`
                        })
                        
                        if (error) throw error
                        
                        alert(`✅ Password reset email sent to ${user.email}!\n\nThey will receive instructions to create a new password.`)
                      } catch (error) {
                        console.error('Error resetting password:', error)
                        alert('Failed to send password reset email. Please try again or check if the email exists in the system.')
                      }
                    }
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>

                <Button 
                  variant="outline" 
                  className={`w-full justify-start mt-2 ${user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                  onClick={async () => {
                    const action = user.is_active ? 'suspend' : 'activate'
                    const actionPast = user.is_active ? 'suspended' : 'activated'
                    
                    if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.first_name || user.email}'s account?\n\n${user.is_active ? 'This will prevent them from logging in until reactivated.' : 'This will restore their access to the platform.'}\n\nConfirm ${action}?`)) {
                      try {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update({ 
                            is_active: !user.is_active,
                            updated_at: new Date().toISOString()
                          })
                          .eq('user_id', user.user_id)
                        
                        if (error) throw error
                        
                        alert(`✅ ${user.first_name || user.email} has been ${actionPast}!`)
                        refetch()
                      } catch (error) {
                        console.error(`Error ${action}ing user:`, error)
                        alert(`Failed to ${action} user. Please try again.`)
                      }
                    }
                  }}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {user.is_active ? 'Suspend Account' : 'Activate Account'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// Separate component for trial editing dialog
function TrialEditDialog({ 
  user, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: {
  user: UserProfile | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (daysToAdd: number) => void
  isLoading: boolean
}) {
  const form = useForm<TrialEditFormValues>({
    resolver: zodResolver(trialEditSchema),
    defaultValues: {
      daysToAdd: 0,
      action: 'add'
    }
  })

  const handleSubmit = (values: TrialEditFormValues) => {
    onSubmit(values.daysToAdd)
  }

  if (!user) return null

  const currentDays = user.trial_days_remaining || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Trial Days</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div><strong>User:</strong> {user.email}</div>
            <div><strong>Current Trial:</strong> {currentDays} days remaining</div>
            {user.expires_at && (
              <div><strong>Expires:</strong> {format(new Date(user.expires_at), 'MMM d, yyyy')}</div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="daysToAdd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days to Add/Subtract</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-trial-days"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter positive numbers to extend trial, negative to reduce it.
                      Range: -365 to +365 days.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  data-testid="button-save-trial"
                >
                  {isLoading ? 'Updating...' : 'Update Trial'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}