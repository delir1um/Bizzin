import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Construction, Rocket, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

interface EarlySignupForm {
  first_name: string;
  email: string;
  business_name: string;
  business_type: string;
  business_size: string;
}

export default function PreLaunchPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<EarlySignupForm>({
    first_name: '',
    email: '',
    business_name: '',
    business_type: '',
    business_size: ''
  });

  // Get platform settings
  const { data: settings } = usePlatformSettings();

  // Submit early signup
  const submitSignup = useMutation({
    mutationFn: async (data: EarlySignupForm) => {
      const { error } = await supabase
        .from('early_signups')
        .insert({
          id: crypto.randomUUID(),
          first_name: data.first_name,
          email: data.email,
          business_name: data.business_name,
          business_type: data.business_type,
          business_size: data.business_size,
          source: 'pre_launch_signup',
          signup_date: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: 'Success!',
        description: 'You\'ve been added to our early access list. We\'ll notify you when *Bizzin* launches!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message.includes('duplicate') 
          ? 'This email is already registered for early access!' 
          : 'Failed to sign up. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email || !formData.business_name || !formData.business_type || !formData.business_size) {
      toast({
        title: 'Please fill in all fields',
        description: 'All fields are required to join our early access list.',
        variant: 'destructive'
      });
      return;
    }
    submitSignup.mutate(formData);
  };

  const handleInputChange = (field: keyof EarlySignupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:bg-[#0B0A1D] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                You're on the list! 🎉
              </h1>
              <p className="text-slate-700 dark:text-slate-300 text-lg">
                Welcome to the exclusive early access for <em className="text-orange-600 dark:text-orange-400">Bizzin</em>
              </p>
            </div>
          </div>

          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-slate-900 dark:text-white font-medium">What happens next?</span>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                  <span className="text-slate-700 dark:text-slate-300 text-sm">
                    You'll receive launch updates via email
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                  <span className="text-slate-700 dark:text-slate-300 text-sm">
                    Get exclusive early access when we launch
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                  <span className="text-slate-700 dark:text-slate-300 text-sm">
                    Special launch discount for early supporters
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Thank you for believing in <em className="text-orange-600 dark:text-orange-400">Bizzin</em>! 
              We can't wait to help you grow your business.
            </p>
            
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              ← Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
            <Construction className="w-8 h-8 text-orange-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              <em className="text-orange-600">Bizzin</em> is Coming Soon
            </h1>
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                Under Construction
              </Badge>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">
            {settings?.launch_message || "We're putting the finishing touches on *Bizzin*! Sign up to be notified when we launch."}
          </p>
        </div>

        {/* Early Access Form */}
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Rocket className="w-5 h-5 text-orange-600" />
              Get Early Access
            </CardTitle>
            <CardDescription className="text-gray-600">
              Be the first to experience AI-powered business intelligence
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-gray-700">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter your first name"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-gray-700">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Enter your business name"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type" className="text-gray-700">Business Type</Label>
                <Select value={formData.business_type} onValueChange={(value) => handleInputChange('business_type', value)}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue placeholder="Select business type" className="placeholder:text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="startup" className="text-gray-900 hover:bg-orange-50">Startup</SelectItem>
                    <SelectItem value="small_business" className="text-gray-900 hover:bg-orange-50">Small Business</SelectItem>
                    <SelectItem value="consulting" className="text-gray-900 hover:bg-orange-50">Consulting</SelectItem>
                    <SelectItem value="ecommerce" className="text-gray-900 hover:bg-orange-50">E-commerce</SelectItem>
                    <SelectItem value="freelance" className="text-gray-900 hover:bg-orange-50">Freelance</SelectItem>
                    <SelectItem value="other" className="text-gray-900 hover:bg-orange-50">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_size" className="text-gray-700">Business Size</Label>
                <Select value={formData.business_size} onValueChange={(value) => handleInputChange('business_size', value)}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue placeholder="Select business size" className="placeholder:text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="solo" className="text-gray-900 hover:bg-orange-50">Solo Entrepreneur</SelectItem>
                    <SelectItem value="2-5" className="text-gray-900 hover:bg-orange-50">2-5 Employees</SelectItem>
                    <SelectItem value="6-20" className="text-gray-900 hover:bg-orange-50">6-20 Employees</SelectItem>
                    <SelectItem value="21-50" className="text-gray-900 hover:bg-orange-50">21-50 Employees</SelectItem>
                    <SelectItem value="50+" className="text-gray-900 hover:bg-orange-50">50+ Employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-shadow"
                disabled={submitSignup.isPending}
              >
                {submitSignup.isPending ? 'Joining List...' : 'Get Early Access'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">What to expect:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Smart journaling with sentiment analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Advanced goal tracking and analytics
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Business podcast platform with learning analytics
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Professional financial calculators and business tools
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Professional document management
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                AI-powered business intelligence and insights
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}