import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPin, Gauge, Settings2, Download, Cross } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/places', icon: MapPin, label: 'Entités médicales' },
  { to: '/quality', icon: Gauge, label: 'Qualité des données' },
  { to: '/scraper', icon: Settings2, label: 'Scraper' },
  { to: '/export', icon: Download, label: 'Export' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
          <Cross className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-bold text-slate-900 text-lg leading-none">Medinaa</span>
          <p className="text-xs text-slate-400 mt-0.5">Madagascar</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-emerald-600' : 'text-slate-400')}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">v1.0 · Données OpenStreetMap</p>
      </div>
    </aside>
  )
}
