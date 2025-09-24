import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, FileText, Shield, Mail } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

export type FooterContentType = 'privacy' | 'terms' | 'contact'

interface FooterContentModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: FooterContentType | null
}

interface FooterContent {
  id: string
  type: FooterContentType
  title: string
  content: string
  is_published: boolean
  created_at: string
  updated_at: string
}

const getContentIcon = (type: FooterContentType) => {
  switch (type) {
    case 'privacy':
      return <Shield className="w-6 h-6 text-blue-600" />
    case 'terms':
      return <FileText className="w-6 h-6 text-orange-600" />
    case 'contact':
      return <Mail className="w-6 h-6 text-green-600" />
    default:
      return <FileText className="w-6 h-6 text-gray-600" />
  }
}

const getDefaultContent = (type: FooterContentType) => {
  switch (type) {
    case 'privacy':
      return {
        title: 'Privacy Policy',
        content: `# Privacy Policy

At Bizzin, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.

## Information We Collect

We collect information you provide directly to us, such as:
- Account information (name, email address, business details)
- Journal entries and business goals
- Documents you upload
- Communication preferences

## How We Use Your Information

We use the information we collect to:
- Provide and improve our services
- Send you important updates and notifications
- Analyze usage patterns to enhance user experience
- Provide customer support

## Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Contact Us

If you have any questions about this Privacy Policy, please contact us at privacy@bizzin.co.za.

*Last updated: ${new Date().toLocaleDateString()}*`
      }
    case 'terms':
      return {
        title: 'Terms of Service',
        content: `# Terms of Service

Welcome to Bizzin! These Terms of Service govern your use of our platform and services.

## Acceptance of Terms

By accessing and using Bizzin, you accept and agree to be bound by the terms and provision of this agreement.

## Use of Service

You may use our service for lawful purposes only. You agree not to use the service:
- For any unlawful purpose or to solicit others to unlawful acts
- To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
- To infringe upon or violate our intellectual property rights or the intellectual property rights of others

## User Accounts

When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.

## Intellectual Property Rights

The service and its original content, features, and functionality are and will remain the exclusive property of Bizzin and its licensors.

## Termination

We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.

## Contact Information

If you have any questions about these Terms, please contact us at legal@bizzin.co.za.

*Last updated: ${new Date().toLocaleDateString()}*`
      }
    case 'contact':
      return {
        title: 'Contact Us',
        content: `# Contact Us

We'd love to hear from you! Get in touch with our team for any questions, support, or feedback.

## Get in Touch

**Email:** support@bizzin.co.za  
**Business Hours:** Monday to Friday, 8:00 AM - 5:00 PM (SAST)

## Support

For technical support and account assistance:
- **Email:** support@bizzin.co.za
- **Response Time:** Within 24 hours during business days

## Business Inquiries

For partnership opportunities and business inquiries:
- **Email:** business@bizzin.co.za

## Feedback

We value your feedback and suggestions:
- **Email:** feedback@bizzin.co.za

## Office Location

**Bizzin (Pty) Ltd**  
Cape Town, South Africa

## Social Media

Stay connected with us on social media for the latest updates and business insights:
- Follow us for business tips and platform updates

---

We're committed to providing excellent support and look forward to helping you grow your business with Bizzin!

*Need immediate assistance? Email us at support@bizzin.co.za*`
      }
    default:
      return {
        title: 'Information',
        content: 'Content not available.'
      }
  }
}

export function FooterContentModal({ isOpen, onClose, contentType }: FooterContentModalProps) {
  const [content, setContent] = useState<FooterContent | null>(null)

  // Fetch footer content from API
  const { data: apiContent, isLoading, error } = useQuery({
    queryKey: ['footer-content', contentType],
    queryFn: async () => {
      if (!contentType) return null
      
      const response = await fetch(`/api/footer-content/${contentType}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }
      
      const result = await response.json()
      return result.content
    },
    enabled: !!contentType && isOpen,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  useEffect(() => {
    if (contentType) {
      if (apiContent) {
        setContent(apiContent)
      } else if (!isLoading && (error || !apiContent)) {
        // Use default content if API fails or returns no content
        const defaultContent = getDefaultContent(contentType)
        setContent({
          id: 'default',
          type: contentType,
          title: defaultContent.title,
          content: defaultContent.content,
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
  }, [apiContent, contentType, isLoading, error])

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{line.substring(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">{line.substring(3)}</h2>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold text-slate-900 dark:text-white mb-2">{line.substring(2, line.length - 2)}</p>
      }
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <p key={index} className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">{line.substring(1, line.length - 1)}</p>
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="text-slate-700 dark:text-slate-300 mb-1 ml-4">{line.substring(2)}</li>
      }
      if (line.trim() === '---') {
        return <hr key={index} className="my-6 border-slate-200 dark:border-slate-700" />
      }
      if (line.trim() === '') {
        return <br key={index} />
      }
      return <p key={index} className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{line}</p>
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        data-testid={`modal-footer-${contentType}`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {contentType && getContentIcon(contentType)}
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              content?.title || (contentType && getDefaultContent(contentType).title) || 'Content'
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {contentType === 'privacy' && 'View our privacy policy and data protection information'}
            {contentType === 'terms' && 'View our terms of service and usage agreement'}
            {contentType === 'contact' && 'View our contact information and support details'}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Content temporarily unavailable
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Showing default content below. Please try again later.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {content?.content ? 
                formatContent(content.content) : 
                (contentType && formatContent(getDefaultContent(contentType).content))
              }
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}