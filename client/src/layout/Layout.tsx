import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/lib/theme-provider"
import { Moon, Sun, User, LogOut, Shield } from "lucide-react"
import { useAuth } from "@/hooks/AuthProvider"
import { useAdminCheck } from "@/hooks/useAdminCheck"
import brizzinLogoDark from "@/assets/brizzin-logo-dark-v2.webp"
import { AiChatWidget } from "@/ai/ui/AiChatWidget"

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const [location] = useLocation()
  const { user, signOut } = useAuth()
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck()
  
  // Check if current user should see the AI widget
  const showAiWidget = user?.email === "anton@cloudfusion.co.za"
  
  const currentLogo = brizzinLogoDark // Always use dark version

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const isActive = (path: string) => {
    return location === path
  }

  const navItems = [
    { path: user ? "/dashboard" : "/", label: user ? "Dashboard" : "Home" },
    { path: "/journal", label: "Journal" },
    { path: "/goals", label: "Goals" },
    { path: "/training", label: "Podcast" },
    { path: "/bizbuilder", label: "BizBuilder Tools" },
    { path: "/docsafe", label: "DocSafe" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-card shadow-sm border-b border-slate-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="h-10 flex items-center justify-center">
                  <img src={currentLogo} alt="Bizzin Logo" className="h-full object-contain" />
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Login Button or User Avatar */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder-avatar.jpg"} alt="@user" />
                        <AvatarFallback className="bg-orange-600 text-white">
                          {user.user_metadata?.first_name?.charAt(0)?.toUpperCase() || 
                           user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin">
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === "light" ? (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Light Mode</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-4">
            <nav className="flex space-x-1 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive(item.path)
                      ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900" style={{ backgroundColor: '#0B0A1D' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-10 flex items-center justify-center">
                <img src={currentLogo} alt="Bizzin Logo" className="h-full object-contain" />
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="#privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                Privacy
              </a>
              <a href="#terms" className="text-slate-400 hover:text-white text-sm transition-colors">
                Terms
              </a>
              <a href="#contact" className="text-slate-400 hover:text-white text-sm transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} <span className="italic">Bizzin</span>. All rights reserved. | Developed by{" "}
              <a 
                href="https://www.cloudfusion.co.za" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                Cloudfusion
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget - Floating for anton@cloudfusion.co.za only */}
      {showAiWidget && (
        <div 
          className="fixed bottom-6 right-6 z-50 shadow-2xl"
          style={{
            width: '380px',
            height: '500px'
          }}
        >
          <AiChatWidget 
            title="Business AI Assistant" 
            className="floating-ai-widget"
            data-testid="floating-ai-widget"
          />
          <style>{`
            .floating-ai-widget {
              width: 100% !important;
              height: 100% !important;
              max-width: none !important;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              border: 1px solid #e2e8f0;
            }
            
            @media (max-width: 640px) {
              .floating-ai-widget {
                position: fixed !important;
                bottom: 0 !important;
                right: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 60vh !important;
                border-radius: 12px 12px 0 0 !important;
                z-index: 60 !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
