import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/AuthProvider"
import { supabase } from "@/lib/supabase"
import { User, Settings, Mail, Phone, MapPin, Calendar, Save, AlertCircle, CheckCircle, Camera, Upload, Trash2, Crown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanManagement } from "@/components/profile/PlanManagement"
import { Alert, AlertDescription } from "@/components/ui/alert"

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  last_name: z.string().max(50, "Last name must be less than 50 characters").optional(),
  full_name: z.string().min(1, "Full name is required").max(100, "Full name must be less than 100 characters"),
  business_name: z.string().max(100, "Business name must be less than 100 characters").optional(),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  // Load existing profile data
  useEffect(() => {
    if (user?.user_metadata) {
      const metadata = user.user_metadata
      setValue('first_name', metadata.first_name || '')
      setValue('last_name', metadata.last_name || '')
      setValue('full_name', metadata.full_name || '')
      setValue('business_name', metadata.business_name || '')
      setValue('phone', metadata.phone || '')
      setValue('location', metadata.location || '')
      setValue('bio', metadata.bio || '')
      setAvatarUrl(metadata.avatar_url || null)
    }
  }, [user, setValue])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const avatarUrl = data.publicUrl

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: avatarUrl
        }
      })

      if (updateError) throw updateError

      setAvatarUrl(avatarUrl)
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload profile picture' })
    } finally {
      setUploading(false)
    }
  }

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    if (!user || !user.user_metadata?.avatar_url) return

    setUploading(true)
    setMessage(null)

    try {
      // Update user metadata to remove avatar URL
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: null
        }
      })

      if (error) throw error

      setAvatarUrl(null)
      setMessage({ type: 'success', text: 'Profile picture removed successfully!' })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove profile picture' })
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: data.first_name,
          last_name: data.last_name || '',
          full_name: data.full_name,
          business_name: data.business_name || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          avatar_url: avatarUrl || null, // Preserve existing avatar URL
        }
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    )
  }

  const getInitials = () => {
    const firstName = user?.user_metadata?.first_name || user?.email?.charAt(0) || 'U'
    const lastName = user?.user_metadata?.last_name?.charAt(0) || ''
    return (firstName + lastName).toUpperCase()
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center relative">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-orange-100 dark:border-orange-900">
                  <AvatarImage src={avatarUrl || "/placeholder-avatar.jpg"} alt="Profile" />
                  <AvatarFallback className="text-xl font-semibold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Avatar Upload/Change Buttons */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20 p-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {/* Upload/Remove Buttons */}
            <div className="flex justify-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs"
              >
                {uploading ? (
                  'Uploading...'
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    {avatarUrl ? 'Change' : 'Upload'}
                  </>
                )}
              </Button>
              
              {avatarUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            <CardTitle className="mt-4">
              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              {user.user_metadata?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.user_metadata.location}</span>
                </div>
              )}
              {user.user_metadata?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.user_metadata.phone}</span>
                </div>
              )}
            </div>
            {user.user_metadata?.bio && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {user.user_metadata.bio}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Basic Information</h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      {...register('first_name')}
                      placeholder="Enter your first name"
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      {...register('last_name')}
                      placeholder="Enter your last name"
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Display Name *</Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Enter your full name as you'd like it displayed"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    This is how your name will appear in quotes and throughout the app.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    {...register('business_name')}
                    placeholder="Enter your business name"
                  />
                  {errors.business_name && (
                    <p className="text-sm text-red-600">{errors.business_name.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    This will be automatically used in financial calculators and reports.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Contact Information</h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed here. Contact support if needed.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="City, Country"
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* About Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    {...register('bio')}
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about yourself and your business goals..."
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600">{errors.bio.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Brief description for your profile. Maximum 500 characters.
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !isDirty}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <PlanManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}