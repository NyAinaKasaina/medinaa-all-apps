import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, ShieldCheck, MapPinned, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { cn, formatNumber, pct } from '@/lib/utils'

const STATUS_META: Record<string, { label: string; bar: string; to: string }> = {
  verified:   { label: 'Vérifié',      bar: 'bg-emerald-500', to: '/places?status=verified' },
  osm_auto:   { label: 'Auto (OSM)',   bar: 'bg-blue-500',    to: '/places?status=osm_auto' },
  unverified: { label: 'À classifier', bar: 'bg-amber-500',   to: '/places?status=unverified' },
}

function QualityBar({ label, value, total, bar, to }: { label: string; value: number; total: number; bar: string; to?: string }) {
  const p = total ? Math.round((value / total) * 100) : 0
  const row = (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-400">{formatNumber(value)} · {p}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', bar)} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
  return to ? <Link to={to} className="block hover:opacity-80 transition-opacity">{row}</Link> : row
}

export function DataQualityPage() {
  const { data: stats, isLoading, isError } = useQuery({ queryKey: ['places-stats'], queryFn: api.places.stats })

  const total = stats?.total ?? 0
  const classified = total - (stats?.byStatus?.unverified ?? 0)
  const geolocated = stats?.geo?.faritra ?? 0
  const sansRegion = total - geolocated

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Qualité des données</h1>
        <p className="text-slate-500 text-sm mt-1">Pertinence et complétude des entités · phase de data cleaning</p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          Backend inaccessible — démarrez le serveur NestJS sur le port 3000.
        </div>
      )}

      {/* Scores en-tête */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard icon={ShieldCheck} label="Classifiées" value={classified} total={total} loading={isLoading} accent="emerald" hint="type attribué" />
        <ScoreCard icon={MapPinned} label="Géolocalisées" value={geolocated} total={total} loading={isLoading} accent="blue" hint="rattachées à une région" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Classification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" /> Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {(['verified', 'osm_auto', 'unverified'] as const).map(s => (
                  <QualityBar key={s} label={STATUS_META[s].label} value={stats?.byStatus?.[s] ?? 0} total={total} bar={STATUS_META[s].bar} to={STATUS_META[s].to} />
                ))}
                <p className="text-xs text-slate-400 pt-1">Cliquez une barre pour ouvrir la liste filtrée.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Géolocalisation (entonnoir) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-slate-400" /> Géolocalisation administrative
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                <QualityBar label="Région (faritra)" value={stats?.geo?.faritra ?? 0} total={total} bar="bg-emerald-500" />
                <QualityBar label="District (distrika)" value={stats?.geo?.distrika ?? 0} total={total} bar="bg-teal-500" />
                <QualityBar label="Commune (kaominina)" value={stats?.geo?.kaominina ?? 0} total={total} bar="bg-sky-500" />
                <QualityBar label="Fokontany" value={stats?.geo?.fokontany ?? 0} total={total} bar="bg-indigo-500" />
                {sansRegion > 0 && (
                  <Link to="/places?geo=missing" className="flex items-center justify-between text-xs text-amber-600 hover:underline pt-1">
                    <span>{formatNumber(sansRegion)} entités sans région</span>
                    <span>à localiser →</span>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complétude des champs */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Complétude des champs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                <QualityBar label="Nom" value={stats?.withName ?? 0} total={total} bar="bg-slate-500" />
                <QualityBar label="Téléphone" value={stats?.withPhone ?? 0} total={total} bar="bg-slate-500" />
                <QualityBar label="Site web" value={stats?.withWebsite ?? 0} total={total} bar="bg-slate-500" />
                <QualityBar label="Horaires" value={stats?.withHours ?? 0} total={total} bar="bg-slate-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScoreCard({ icon: Icon, label, value, total, loading, accent, hint }: {
  icon: React.ElementType; label: string; value: number; total: number; loading: boolean; accent: 'emerald' | 'blue'; hint: string
}) {
  const p = total ? pct(value, total) : 0
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', bar: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', bar: 'bg-blue-500' },
  }[accent]
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colors.bg)}>
            <Icon className={cn('w-5 h-5', colors.icon)} />
          </div>
          <span className="text-sm font-medium text-slate-600">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-3xl font-bold text-slate-900">{p}<span className="text-lg text-slate-400">%</span></p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">{formatNumber(value)} / {formatNumber(total)} · {hint}</p>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
          <div className={cn('h-full rounded-full transition-all duration-500', colors.bar)} style={{ width: `${p}%` }} />
        </div>
      </CardContent>
    </Card>
  )
}
