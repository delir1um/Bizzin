import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, TrendingUp, Target, FileText, Shield, Brain, Users, Mail, ArrowRight, Star, Building, Zap } from "lucide-react"
import brizzinLogoDark from "@/assets/brizzin-logo-dark-v2.webp"
import { supabase } from "@/lib/supabase"

const leadSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  first_name: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  business_name: z.string().min(1, "Business name is required").max(100, "Business name must be less than 100 characters"),
  business_type: z.string().min(1, "Please select your business type"),
  business_size: z.string().min(1, "Please select your business size"),
})

type LeadFormData = z.infer<typeof leadSchema>

export default function PreLaunchPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  })

  const businessType = watch("business_type")
  const businessSize = watch("business_size")

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      // Insert lead into Supabase
      const { error } = await supabase
        .from('early_signups')
        .insert([{
          email: data.email,
          first_name: data.first_name,
          business_name: data.business_name,
          business_type: data.business_type,
          business_size: data.business_size,
          signup_date: new Date().toISOString(),
          source: 'pre_launch_landing'
        }])

      if (error) throw error

      setSubmitted(true)
      setMessage({ 
        type: 'success', 
        text: "Welcome aboard! You'll be among the first to access *Bizzin* when we launch." 
      })
    } catch (error: any) {
      console.error('Error submitting lead:', error)
      setMessage({ 
        type: 'error', 
        text: "Something went wrong. Please try again or contact us directly." 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-blue-600" />,
      title: "AI-Powered Business Intelligence",
      description: "Advanced AI analyzes your business patterns, identifies growth opportunities, and provides personalized insights to accelerate your success."
    },
    {
      icon: <Target className="w-6 h-6 text-green-600" />,
      title: "Smart Goal Tracking & Analytics",
      description: "Set, track, and achieve your business goals with intelligent progress monitoring and predictive analytics that keep you on track."
    },
    {
      icon: <FileText className="w-6 h-6 text-purple-600" />,
      title: "Intelligent Business Journal",
      description: "Capture daily insights, challenges, and wins. Our AI automatically categorizes entries and identifies patterns to boost your decision-making."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      title: "Professional Financial Suite",
      description: "Access enterprise-grade financial calculators, cash flow analysis, and business planning tools designed for South African entrepreneurs."
    },
    {
      icon: <Shield className="w-6 h-6 text-red-600" />,
      title: "Secure Document Management",
      description: "Smart document hub with intelligent categorization, secure storage, and instant search across all your business files."
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      title: "Business Learning Platform",
      description: "Curated business education content with progress tracking, designed specifically for South African market conditions."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Mitchell",
      business: "Digital Marketing Agency, Cape Town",
      quote: "Finally, a platform built specifically for South African entrepreneurs. The AI insights have transformed how I make business decisions."
    },
    {
      name: "Michael Ndaba",
      business: "E-commerce Startup, Johannesburg",
      quote: "The goal tracking and financial tools are exactly what I needed to scale my business. Can't wait for the full launch!"
    },
    {
      name: "Lisa van der Merwe",
      business: "Consulting Firm, Durban",
      quote: "The business intelligence features give me insights I never had before. This will be a game-changer for South African SMEs."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-10 flex items-center justify-center">
                <img src={brizzinLogoDark} alt="Bizzin Logo" className="h-full object-contain" />
              </div>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              Coming Soon
            </Badge>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Zap className="w-3 h-3 mr-1" />
                    AI-Powered Business Intelligence
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                    Transform Your Business with <em className="text-orange-600">Bizzin</em>
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                    The first AI-powered business intelligence platform designed specifically for South African entrepreneurs. 
                    Make smarter decisions, track goals intelligently, and accelerate your business growth.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>Advanced AI Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>South African Business Context</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>Enterprise-Grade Security</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-3">
                    <Star className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Be Among the First 100 Early Access Users
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">
                        Join our exclusive early access program and get lifetime benefits, priority support, 
                        and special pricing when we launch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Capture Form */}
              <div className="lg:pl-8">
                <Card className="bg-white dark:bg-slate-800 shadow-2xl border-0">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                      {submitted ? "You're In! 🎉" : "Get Early Access"}
                    </CardTitle>
                    {!submitted && (
                      <p className="text-slate-600 dark:text-slate-300">
                        Reserve your spot and be the first to experience the future of business intelligence.
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {submitted ? (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Welcome to the Future!
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300">
                            Thank you for joining our early access program. We'll keep you updated on our progress 
                            and notify you as soon as <em>Bizzin</em> is ready for launch.
                          </p>
                        </div>
                        <div className="pt-4">
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Early Access Member #1
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                              id="first_name"
                              {...register('first_name')}
                              placeholder="Enter your first name"
                              className="h-11"
                            />
                            {errors.first_name && (
                              <p className="text-sm text-red-600">{errors.first_name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              {...register('email')}
                              placeholder="your@business-email.com"
                              className="h-11"
                            />
                            {errors.email && (
                              <p className="text-sm text-red-600">{errors.email.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="business_name">Business Name *</Label>
                            <Input
                              id="business_name"
                              {...register('business_name')}
                              placeholder="Your Business Name"
                              className="h-11"
                            />
                            {errors.business_name && (
                              <p className="text-sm text-red-600">{errors.business_name.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="business_type">Business Type *</Label>
                            <Select onValueChange={(value) => setValue('business_type', value)}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select your business type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="startup">Startup</SelectItem>
                                <SelectItem value="e-commerce">E-commerce</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                                <SelectItem value="marketing">Marketing Agency</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="services">Professional Services</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.business_type && (
                              <p className="text-sm text-red-600">{errors.business_type.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="business_size">Business Size *</Label>
                            <Select onValueChange={(value) => setValue('business_size', value)}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select your business size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="solo">Solo Entrepreneur</SelectItem>
                                <SelectItem value="2-10">2-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="200+">200+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.business_size && (
                              <p className="text-sm text-red-600">{errors.business_size.message}</p>
                            )}
                          </div>
                        </div>

                        {message && (
                          <div className={`p-3 rounded-lg text-sm ${
                            message.type === 'success' 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                          }`}>
                            {message.text}
                          </div>
                        )}

                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold"
                        >
                          {isSubmitting ? (
                            "Securing Your Spot..."
                          ) : (
                            <>
                              Get Early Access
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          By signing up, you agree to receive updates about <em>Bizzin</em>. 
                          We respect your privacy and won't spam you.
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything You Need to Scale Your Business
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                <em>Bizzin</em> combines advanced AI technology with practical business tools, 
                specifically designed for the South African entrepreneurial landscape.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-slate-50 dark:bg-slate-700 border-0 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Trusted by South African Entrepreneurs
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                See what early beta users are saying about <em>Bizzin</em>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white dark:bg-slate-800 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {testimonial.business}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-orange-100">
                Join hundreds of South African entrepreneurs who are already preparing 
                to revolutionize their business operations with <em>Bizzin</em>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 text-orange-100">
                  <Building className="w-5 h-5" />
                  <span>Built for South African Business</span>
                </div>
                <div className="flex items-center gap-2 text-orange-100">
                  <Shield className="w-5 h-5" />
                  <span>Enterprise-Grade Security</span>
                </div>
                <div className="flex items-center gap-2 text-orange-100">
                  <Brain className="w-5 h-5" />
                  <span>Advanced AI Technology</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="h-10 flex items-center justify-center">
              <img src={brizzinLogoDark} alt="Bizzin Logo" className="h-full object-contain" />
            </div>
            <p className="text-slate-400">
              <em>Bizzin</em> - AI-Powered Business Intelligence for South African Entrepreneurs
            </p>
            <div className="flex justify-center gap-6 text-sm text-slate-400">
              <a href="mailto:hello@bizzin.co.za" className="hover:text-white transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@bizzin.co.za
              </a>
            </div>
            <Separator className="bg-slate-700" />
            <p className="text-sm text-slate-500">
              © 2025 <em>Bizzin</em>. All rights reserved. Coming Soon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}