import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Cross } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/carte': 'Carte',
  '/places': 'Entités médicales',
  '/quality': 'Qualité des données',
  '/scraper': 'Scraper',
  '/export': 'Export',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const title = pathname.startsWith('/places/') ? 'Détail' : (TITLES[pathname] ?? 'Medinaa')

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
          <Cross className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-semibold text-slate-900 text-base">{title}</h1>
      </header>

      {/* Content */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
