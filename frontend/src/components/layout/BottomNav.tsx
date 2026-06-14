import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPin, Gauge, Settings2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/places', icon: MapPin, label: 'Entités' },
  { to: '/quality', icon: Gauge, label: 'Qualité' },
  { to: '/scraper', icon: Settings2, label: 'Scraper' },
  { to: '/export', icon: Download, label: 'Export' },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-pb">
      <div className="flex items-stretch h-16">
        {TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors cursor-pointer pt-1',
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive && 'text-emerald-600')} />
                <span className={cn('text-[10px]', isActive ? 'text-emerald-600 font-semibold' : '')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
