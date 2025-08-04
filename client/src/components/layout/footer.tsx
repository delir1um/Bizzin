import brizzinLogoDark from "@/assets/brizzin-logo-dark-v2.webp"

export function Footer() {
  return (
    <footer className="bg-slate-900" style={{ backgroundColor: '#0B0A1D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-10 flex items-center justify-center">
              <img src={brizzinLogoDark} alt="Bizzin Logo" className="h-full object-contain" />
            </div>
          </div>
          <div className="flex space-x-6">
            <a href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
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
          <p className="text-slate-400 text-sm">&copy; 2024 <span className="italic">Bizzin</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
