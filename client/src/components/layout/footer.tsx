export function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-white">Bizzin</span>
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
          <p className="text-slate-400 text-sm">&copy; 2024 Bizzin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
