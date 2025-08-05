import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  Download, 
  Mail, 
  TrendingUp,
  Users,
  Building,
  Calendar,
  Filter,
  Send
} from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface EarlySignup {
  id: string
  email: string
  first_name: string
  business_name: string
  business_type: string
  business_size: string
  signup_date: string
  source: string
  is_notified: boolean
}

export function AdminEarlySignups() {
  const [searchTerm, setSearchTerm] = useState("")
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all")
  const [businessSizeFilter, setBusinessSizeFilter] = useState<string>("all")
  const [selectedSignups, setSelectedSignups] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  // Fetch early signups with real-time updates
  const { data: signups, isLoading, refetch } = useQuery({
    queryKey: ['admin-early-signups', searchTerm, businessTypeFilter, businessSizeFilter],
    queryFn: async () => {
      let query = supabase
        .from('early_signups')
        .select('*')
        .order('signup_date', { ascending: false })

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%`)
      }

      if (businessTypeFilter !== 'all') {
        query = query.eq('business_type', businessTypeFilter)
      }

      if (businessSizeFilter !== 'all') {
        query = query.eq('business_size', businessSizeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    refetchInterval: 30000 // Refresh every 30 seconds for new signups
  })

  // Get unique business types and sizes for filters
  const businessTypes = [...new Set(signups?.map(s => s.business_type) || [])]
  const businessSizes = [...new Set(signups?.map(s => s.business_size) || [])]

  // Calculate stats
  const stats = signups ? {
    total: signups.length,
    thisWeek: signups.filter(s => new Date(s.signup_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    notified: signups.filter(s => s.is_notified).length,
    pending: signups.filter(s => !s.is_notified).length
  } : { total: 0, thisWeek: 0, notified: 0, pending: 0 }

  const handleSelectAll = () => {
    if (selectedSignups.size === signups?.length) {
      setSelectedSignups(new Set())
    } else {
      setSelectedSignups(new Set(signups?.map(s => s.id) || []))
    }
  }

  const handleSelectSignup = (id: string) => {
    const newSelected = new Set(selectedSignups)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSignups(newSelected)
  }

  const handleExportSignups = () => {
    if (!signups) return

    const csvContent = [
      ['Email', 'Name', 'Business', 'Type', 'Size', 'Signup Date', 'Source', 'Notified'].join(','),
      ...signups.map(signup => [
        signup.email,
        signup.first_name,
        signup.business_name,
        signup.business_type,
        signup.business_size,
        format(new Date(signup.signup_date), 'yyyy-MM-dd HH:mm'),
        signup.source,
        signup.is_notified ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bizzin-early-signups-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBulkNotify = async () => {
    if (selectedSignups.size === 0) return

    try {
      const { error } = await supabase
        .from('early_signups')
        .update({ is_notified: true })
        .in('id', [...selectedSignups])

      if (error) throw error

      refetch()
      setSelectedSignups(new Set())
      
      // In production, this would trigger email notifications
      console.log(`Would send notification emails to ${selectedSignups.size} users`)
    } catch (error) {
      console.error('Error updating notification status:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Outreach</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Not yet contacted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Signups → Paid Users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Business Type</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessTypes[0] || '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most common type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Early Signups Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by email, name, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Business Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {businessTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={businessSizeFilter} onValueChange={setBusinessSizeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Business Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {businessSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                onClick={handleBulkNotify} 
                disabled={selectedSignups.size === 0}
                variant="default"
              >
                <Send className="w-4 h-4 mr-2" />
                Notify Selected ({selectedSignups.size})
              </Button>
              
              <Button onClick={handleExportSignups} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Signups Table */}
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
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedSignups.size === signups?.length && signups?.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Type & Size</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups?.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedSignups.has(signup.id)}
                          onCheckedChange={() => handleSelectSignup(signup.id)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{signup.first_name}</div>
                          <div className="text-sm text-muted-foreground">{signup.email}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">{signup.business_name}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline">{signup.business_type}</Badge>
                          <div className="text-xs text-muted-foreground">{signup.business_size}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(signup.signup_date), 'MMM d, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(signup.signup_date), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="secondary">{signup.source}</Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={signup.is_notified ? 'default' : 'secondary'}>
                          {signup.is_notified ? 'Contacted' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {signups && signups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No early signups found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}