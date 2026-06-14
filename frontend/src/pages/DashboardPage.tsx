import { useQuery } from '@tanstack/react-query'
import { Building2, Phone, Globe, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatNumber, pct } from '@/lib/utils'

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  urgences_secours:   { label: 'Urgences & secours',   color: 'bg-red-500' },
  soins_proximite:    { label: 'Soins de proximité',   color: 'bg-emerald-500' },
  soins_specialises:  { label: 'Soins spécialisés',    color: 'bg-violet-500' },
  maternite_enfance:  { label: 'Maternité & enfance',  color: 'bg-pink-500' },
  produits_sante:     { label: 'Produits de santé',    color: 'bg-blue-500' },
  diagnostic_analyse: { label: 'Diagnostic & analyse', color: 'bg-amber-500' },
}
const JOB_STATUS_STYLES: Record<string, { variant: 'default' | 'warning' | 'destructive' | 'secondary' | 'success'; label: string }> = {
  running:  { variant: 'default',     label: 'En cours' },
  paused:   { variant: 'warning',     label: 'En pause' },
  done:     { variant: 'success',     label: 'Terminé' },
  failed:   { variant: 'destructive', label: 'Échoué' },
  pending:  { variant: 'secondary',   label: 'En attente' },
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['places-stats'],
    queryFn: api.places.stats,
  })
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: api.scraper.status,
    refetchInterval: 8000,
  })

  const statCards = [
    { label: 'Entités totales', value: stats?.total, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avec téléphone', value: stats?.withPhone, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avec site web', value: stats?.withWebsite, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avec horaires', value: stats?.withHours, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const topCategories = Object.entries(stats?.byCategory ?? {})
    .sort((a, b) => b[1] - a[1])

  const maxCategoryCount = topCategories[0]?.[1] ?? 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">Entités médicales collectées à Madagascar</p>
      </div>

      {/* Stat cards */}
      {statsError ? (
        <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          Backend inaccessible — démarrez le serveur NestJS sur le port 3000.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(value ?? 0)}</p>
                )}
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Types breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topCategories.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucune donnée classifiée</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map(([slug, count]) => (
                  <div key={slug} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{CATEGORY_META[slug]?.label ?? slug}</span>
                      <span className="text-slate-400">{formatNumber(count)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${CATEGORY_META[slug]?.color ?? 'bg-slate-400'}`}
                        style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {stats != null && stats.unverified > 0 && (
              <p className="mt-4 text-xs text-amber-600">
                {formatNumber(stats.unverified)} entités encore à classifier
              </p>
            )}
          </CardContent>
        </Card>

        {/* Scraper status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dernier scrape</CardTitle>
          </CardHeader>
          <CardContent>
            {jobLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : !job ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">Aucun job de scrape</p>
                <p className="text-xs text-slate-300 mt-1">Démarrez depuis l'onglet Scraper</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {job.status === 'running' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                  <Badge variant={JOB_STATUS_STYLES[job.status]?.variant ?? 'secondary'}>
                    {JOB_STATUS_STYLES[job.status]?.label ?? job.status}
                  </Badge>
                  <span className="text-xs text-slate-400">Overpass OSM</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Entités sauvegardées</span>
                    <span>{formatNumber(job.savedNodes)} / {formatNumber(job.totalNodes)}</span>
                  </div>
                  <Progress value={job.totalNodes ? (job.savedNodes / job.totalNodes) * 100 : 0} />
                </div>

                {stats && (
                  <p className="text-xs text-slate-400">
                    {formatNumber(stats.total)} entités en base · {pct(stats.withPhone, stats.total)}% avec tél.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
