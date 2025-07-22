import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Download, Trash2, Eye, Database, FileText, Users } from "lucide-react"

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          How we protect your data and respect your privacy
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Last updated: July 22, 2025
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            Our Commitment to Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300">
            Bizzin is built with privacy by design. We collect only the data necessary to provide our services, 
            implement strong security measures, and give you complete control over your information. Your business 
            data belongs to you, and we're committed to keeping it secure and private.
          </p>
        </CardContent>
      </Card>

      {/* Data Collection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            What Data We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Account Information</h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Email address (for authentication and account recovery)</li>
              <li>• Account preferences and settings</li>
              <li>• Subscription and billing information</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Business Data You Create</h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Goals and objectives you set</li>
              <li>• Journal entries and reflections</li>
              <li>• Documents uploaded to DocSafe</li>
              <li>• Business planning data and calculations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Usage Information</h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Feature usage and activity logs</li>
              <li>• Performance and error monitoring</li>
              <li>• Session information for security</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* DocSafe Privacy Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            DocSafe Document Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Our document management system is designed with enterprise-grade privacy and security:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Private Storage</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Documents stored in isolated, encrypted folders accessible only to you
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Access Control</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Row-level security ensures you can only access your own documents
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Data Portability</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Download your documents anytime with original filenames preserved
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Complete Deletion</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Deleted documents are permanently removed from all systems
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">No Content Scanning</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We never read, analyze, or process your document contents
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">No Sharing by Default</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    All documents are private unless you explicitly choose to share
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Privacy Rights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Data Control</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Access all your data anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Update or correct information</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-purple-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Download all your data</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-red-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Delete your account and data</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">GDPR Compliance</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-orange-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Lawful basis for processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-indigo-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Data minimization practices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-teal-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Purpose limitation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-pink-500"></Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Privacy by design</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            Security Measures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Technical Safeguards</h3>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                <li>• End-to-end encryption for data transmission</li>
                <li>• Encrypted storage for all user data</li>
                <li>• Secure authentication and session management</li>
                <li>• Regular security updates and monitoring</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Administrative Controls</h3>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                <li>• Limited employee access to user data</li>
                <li>• Regular security training and audits</li>
                <li>• Incident response procedures</li>
                <li>• Compliance with industry standards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Data Sharing and Third Parties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">We Never Sell Your Data</h3>
              <p className="text-slate-700 dark:text-slate-300">
                We do not sell, rent, or trade your personal information or business data to third parties for marketing or any other purposes.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Service Providers</h3>
              <p className="text-slate-700 dark:text-slate-300">
                We work with trusted service providers (like Supabase for infrastructure) who help us deliver our services. 
                These providers are bound by strict confidentiality agreements and can only use your data to provide services to us.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Us About Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            If you have any questions about this privacy policy or how we handle your data, please contact us:
          </p>
          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <p>Email: privacy@bizzin.com</p>
            <p>Response time: Within 48 hours</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}