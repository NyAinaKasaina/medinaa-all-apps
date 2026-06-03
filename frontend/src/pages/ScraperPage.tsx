import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, Loader2, AlertCircle, CheckCircle2, Clock, Database, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatNumber, cn } from '@/lib/utils'

const STATUS_CONFIG = {
  running:  { label: 'En cours',    variant: 'default'     as const, icon: Loader2, spin: true },
  paused:   { label: 'En pause',    variant: 'warning'     as const, icon: Pause,   spin: false },
  done:     { label: 'Terminé',     variant: 'success'     as const, icon: CheckCircle2, spin: false },
  failed:   { label: 'Échoué',      variant: 'destructive' as const, icon: AlertCircle, spin: false },
  pending:  { label: 'En attente',  variant: 'secondary'   as const, icon: Clock,   spin: false },
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function ScraperPage() {
  const qc = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: api.scraper.status,
    refetchInterval: (query) => query.state.data?.status === 'running' ? 2000 : 10000,
  })

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['scraper-jobs'],
    queryFn: api.scraper.jobs,
    refetchInterval: 15000,
  })

  const startMutation = useMutation({
    mutationFn: api.scraper.start,
    onSuccess: (res) => {
      setFeedback(res.message)
      qc.invalidateQueries({ queryKey: ['scraper-status'] })
      qc.invalidateQueries({ queryKey: ['scraper-jobs'] })
      setTimeout(() => setFeedback(null), 4000)
    },
  })

  const pauseMutation = useMutation({
    mutationFn: api.scraper.pause,
    onSuccess: (res) => {
      setFeedback(res.message)
      setTimeout(() => setFeedback(null), 4000)
    },
  })

  const isRunning = job?.status === 'running'
  const phase1Pct = job?.totalQueries ? (job.processedQueriesCount / job.totalQueries) * 100 : 0
  const phase2Pct = job?.collectedPlaceIdsCount ? (job.enrichedPlaceIdsCount / job.collectedPlaceIdsCount) * 100 : 0
  const cfg = job ? STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scraper</h1>
        <p className="text-slate-500 text-sm mt-1">Collecte des entités médicales via Google Places API</p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
          <WifiOff className="w-4 h-4" />
          Backend inaccessible — démarrez le serveur NestJS sur le port 3000.
        </div>
      )}

      {feedback && (
        <div className="flex items-center gap-2 text-emerald-700 text-sm p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <Wifi className="w-4 h-4" />
          {feedback}
        </div>
      )}

      {/* Controls + status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contrôle</CardTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-24 rounded-full" />
            ) : cfg ? (
              <Badge variant={cfg.variant} className="gap-1.5">
                <cfg.icon className={cn('w-3 h-3', cfg.spin && isRunning && 'animate-spin')} />
                {cfg.label}
                {job && <span className="opacity-70">· Phase {job.phase}</span>}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Progress bars */}
          {job ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="font-medium">Phase 1 — Nearby Search</span>
                  <span>{formatNumber(job.processedQueriesCount)} / {formatNumber(job.totalQueries)}</span>
                </div>
                <Progress value={phase1Pct} />
                <p className="text-xs text-slate-400">{phase1Pct.toFixed(1)}% — {formatNumber(job.collectedPlaceIdsCount)} IDs collectés</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="font-medium">Phase 2 — Place Details</span>
                  <span>{formatNumber(job.enrichedPlaceIdsCount)} / {formatNumber(job.collectedPlaceIdsCount)}</span>
                </div>
                <Progress value={phase2Pct} indicatorClassName="bg-teal-500" />
                <p className="text-xs text-slate-400">{phase2Pct.toFixed(1)}% — {formatNumber(job.enrichedPlaceIdsCount)} entités sauvegardées en base</p>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-4">
                <Database className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Aucun job actif</p>
                <p className="text-xs text-slate-300 mt-1">Cliquez sur Démarrer pour lancer la collecte</p>
              </div>
            )
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => startMutation.mutate()}
              disabled={isRunning || startMutation.isPending}
            >
              {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {job?.status === 'paused' ? 'Reprendre' : 'Démarrer'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => pauseMutation.mutate()}
              disabled={!isRunning || pauseMutation.isPending}
            >
              {pauseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              Pause
            </Button>
          </div>

          {/* Stats grid */}
          {job && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <StatItem label="IDs collectés" value={formatNumber(job.collectedPlaceIdsCount)} />
              <StatItem label="Enrichis" value={formatNumber(job.enrichedPlaceIdsCount)} />
              <StatItem label="Erreurs" value={formatNumber(job.errors?.length ?? 0)} error={(job.errors?.length ?? 0) > 0} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !jobs?.length ? (
            <p className="text-slate-400 text-sm text-center py-4">Aucun job enregistré</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.slice(0, 10).map(j => {
                const c = STATUS_CONFIG[j.status] ?? STATUS_CONFIG.pending
                return (
                  <div key={j.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={c.variant} className="text-[10px] py-0">
                          {c.label}
                        </Badge>
                        <span className="text-xs text-slate-400">Phase {j.phase}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatNumber(j.enrichedPlaceIdsCount)} enrichis · démarré {formatDate(j.startedAt)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-300 flex-shrink-0">
                      {j.id.slice(0, 8)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatItem({ label, value, error }: { label: string; value: string; error?: boolean }) {
  return (
    <div className="text-center p-2 rounded-xl bg-slate-50">
      <p className={cn('text-lg font-bold', error ? 'text-red-600' : 'text-slate-900')}>{value}</p>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
    </div>
  )
}
