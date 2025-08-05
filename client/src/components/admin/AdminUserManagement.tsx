import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface UserProfile {
  user_id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  business_name: string
  plan_type: 'free' | 'premium'
  plan_status: 'active' | 'cancelled' | 'expired'
  created_at: string
  last_login: string
  is_active: boolean
  total_journal_entries: number
  completed_goals: number
  storage_used: number
  last_activity: string
}

export function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  // Fetch users with comprehensive data
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, planFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select(`
          user_id,
          email,
          first_name,
          last_name,
          full_name,
          business_name,
          created_at,
          last_login,
          is_active,
          user_plans!inner(plan_type, plan_status, created_at),
          journal_entries(count),
          goals(count),
          documents(file_size)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%`)
      }

      if (planFilter !== 'all') {
        query = query.eq('user_plans.plan_type', planFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('user_plans.plan_status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data to match our interface
      return data?.map((user: any) => ({
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        business_name: user.business_name,
        plan_type: user.user_plans?.[0]?.plan_type || 'free',
        plan_status: user.user_plans?.[0]?.plan_status || 'active',
        created_at: user.created_at,
        last_login: user.last_login,
        is_active: user.is_active,
        total_journal_entries: Array.isArray(user.journal_entries) ? user.journal_entries.length : 0,
        completed_goals: Array.isArray(user.goals) ? user.goals.length : 0,
        storage_used: Array.isArray(user.documents) ? user.documents.reduce((sum: number, doc: any) => sum + (doc.file_size || 0), 0) : 0,
        last_activity: user.last_login || user.created_at
      })) || []
    },
    refetchInterval: 60000 // Refresh every minute
  })

  const handleExportUsers = () => {
    if (!users) return

    const csvContent = [
      ['Email', 'Name', 'Business', 'Plan', 'Status', 'Created', 'Last Login', 'Journal Entries', 'Goals', 'Storage (MB)'].join(','),
      ...users.map(user => [
        user.email,
        user.full_name || `${user.first_name} ${user.last_name}`,
        user.business_name || '',
        user.plan_type,
        user.plan_status,
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
                    <TableHead>Activity</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
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
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Billing details would be displayed here in production.</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="actions">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="w-4 h-4 mr-2" />
              View Activity Log
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}