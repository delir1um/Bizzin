import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Plus, FileText, Lock, ArrowRight, Upload, Search, Download } from "lucide-react"
import { useLocation } from "wouter"

const demoDocuments = [
  {
    id: "demo-1",
    name: "Business Plan v2.4.pdf",
    type: "Business Plan",
    size: "2.3 MB",
    uploadDate: "2025-07-20",
    tags: ["Strategy", "Planning", "Q3"],
    isBlurred: false
  },
  {
    id: "demo-2",
    name: "Investor Pitch Deck.pptx", 
    type: "Presentation",
    size: "5.7 MB",
    uploadDate: "2025-07-18",
    tags: ["Fundraising", "Investors"],
    isBlurred: true
  },
  {
    id: "demo-3",
    name: "Legal Documents Package.zip",
    type: "Legal",
    size: "12.1 MB", 
    uploadDate: "2025-07-15",
    tags: ["Legal", "Contracts", "Compliance"],
    isBlurred: true
  },
  {
    id: "demo-4",
    name: "Financial Projections.xlsx",
    type: "Financial",
    size: "890 KB",
    uploadDate: "2025-07-12",
    tags: ["Finance", "Projections", "Revenue"],
    isBlurred: true
  }
]

const typeColors = {
  "Business Plan": "bg-blue-100 text-blue-800",
  "Presentation": "bg-purple-100 text-purple-800",
  "Legal": "bg-red-100 text-red-800",
  "Financial": "bg-green-100 text-green-800",
  "Marketing": "bg-orange-100 text-orange-800"
}

export function DocSafePreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:bg-[#0B0A1D]">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-[#0B0A1D]/80 backdrop-blur-sm border-b border-emerald-200 dark:border-slate-700 min-h-[200px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Intelligent Document Hub</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Smart categorization, advanced search, multi-format viewer, professional document management, and secure cloud storage with intelligent organization
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-2 rounded">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Upload</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">Document Storage</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-2 rounded">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">Folders</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Organization</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-2 rounded">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">Search</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Find Files</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Upload Your Business Documents</h2>
            <p className="text-emerald-100 mb-4">Store and organize your own important business files securely</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-medium"
              >
                Start Secure Storage <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

            </div>
          </div>
        </div>

        {/* Documents Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Example Document Layout</h2>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {demoDocuments.map((doc, index) => (
              <Card 
                key={doc.id}
                className={`relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-lg transition-all h-full flex flex-col ${doc.isBlurred ? 'opacity-60' : ''}`}
              >
                {doc.isBlurred && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Sign up to access documents
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setLocation('/auth')}
                      >
                        Unlock Vault
                      </Button>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{doc.name}</CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={typeColors[doc.type as keyof typeof typeColors]}>
                        {doc.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* File Info */}
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>Size: {doc.size}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-7">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {doc.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure Storage</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Store important business documents with file upload and organization features
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Find Documents</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Search through your uploaded documents and filter by categories
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Upload className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">File Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Upload, organize, and manage your business documents and files
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <Button 
            size="lg"
            onClick={() => setLocation('/auth')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg"
          >
            Secure Your Documents Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Free trial • No credit card required
          </p>
        </div>
      </div>
    </div>
  )
}