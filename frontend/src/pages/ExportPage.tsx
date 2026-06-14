import { useQuery } from '@tanstack/react-query'
import { Download, FileJson, FileText, Database, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/utils'

export function ExportPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['places-stats'],
    queryFn: api.places.stats,
  })

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export des données</h1>
        <p className="text-slate-500 text-sm mt-1">Téléchargez toutes les entités médicales collectées</p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          Backend inaccessible — démarrez le serveur NestJS sur le port 3000.
        </div>
      )}

      {/* Stats summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {isLoading ? <Skeleton className="h-5 w-20 inline-block" /> : `${formatNumber(stats?.total ?? 0)} entités`}
              </p>
              <p className="text-xs text-slate-400">prêtes à l'export</p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="font-bold text-slate-900">{formatNumber(stats.withPhone)}</p>
                <p className="text-xs text-slate-400">Avec tél.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="font-bold text-slate-900">{formatNumber(stats.withWebsite)}</p>
                <p className="text-xs text-slate-400">Avec site</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="font-bold text-slate-900">{formatNumber(stats.withHours)}</p>
                <p className="text-xs text-slate-400">Avec horaires</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export options */}
      <div className="space-y-3">
        <ExportCard
          icon={FileJson}
          title="Export JSON"
          description="Données complètes avec tous les champs, idéal pour l'intégration"
          format="JSON"
          color="blue"
          onDownload={() => handleDownload(api.export.jsonUrl, 'medical_entities_madagascar.json')}
          disabled={!stats?.total}
        />
        <ExportCard
          icon={FileText}
          title="Export CSV"
          description="Format tableur compatible Excel/Sheets, colonnes séparées"
          format="CSV"
          color="emerald"
          onDownload={() => handleDownload(api.export.csvUrl, 'medical_entities_madagascar.csv')}
          disabled={!stats?.total}
        />
      </div>

      {/* Columns info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Colonnes incluses</p>
          <div className="flex flex-wrap gap-1.5">
            {['osm_id','name','name_mg','type_slug','category_slug','classification_status','amenity','healthcare','lat','lng','phone','website','opening_hours','code_faritra','code_distrika','code_kaominina','code_fokontany','addr_city','operator','beds','emergency','osm_url','scraped_at'].map(col => (
              <span key={col} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                {col}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ExportCard({
  icon: Icon,
  title,
  description,
  format,
  color,
  onDownload,
  disabled,
}: {
  icon: React.ElementType
  title: string
  description: string
  format: string
  color: 'blue' | 'emerald'
  onDownload: () => void
  disabled?: boolean
}) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  }
  const c = colors[color]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${c.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${c.badge}`}>{format}</span>
            </div>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <Button
          className="w-full mt-4"
          variant={color === 'blue' ? 'outline' : 'default'}
          disabled={disabled}
          onClick={onDownload}
        >
          <Download className="w-4 h-4" />
          Télécharger {format}
        </Button>
      </CardContent>
    </Card>
  )
}
