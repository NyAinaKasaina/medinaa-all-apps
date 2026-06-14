import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, AlertCircle, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaceCard } from '@/components/places/PlaceCard'
import { api } from '@/lib/api'
import { useTaxonomy } from '@/lib/taxonomy'
import { cn, formatNumber } from '@/lib/utils'

const SELECT = 'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none'

export function PlacesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [faritra, setFaritra] = useState<string | undefined>()
  const [distrika, setDistrika] = useState<string | undefined>()
  const [page, setPage] = useState(1)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(id)
  }, [search])

  const resetPage = useCallback(() => setPage(1), [])
  useEffect(resetPage, [debouncedSearch, category, faritra, distrika, resetPage])

  const { data: taxonomy } = useTaxonomy()
  const { data: faritraList } = useQuery({ queryKey: ['faritra'], queryFn: api.geo.faritra, staleTime: Infinity })
  const { data: distrikaList } = useQuery({
    queryKey: ['distrika', faritra],
    queryFn: () => api.geo.distrika(faritra!),
    enabled: !!faritra,
    staleTime: Infinity,
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['places', { q: debouncedSearch, category, faritra, distrika, page }],
    queryFn: () => api.places.list({
      q: debouncedSearch || undefined,
      category: category || undefined,
      faritra,
      distrika,
      page,
      limit: 20,
    }),
  })

  const chips = [{ slug: '', labelFr: 'Tous' }, ...(taxonomy ?? [])]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Entités médicales</h1>
        {data && <p className="text-slate-500 text-sm mt-1">{formatNumber(data.total)} établissements trouvés</p>}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9 h-11 text-base"
          placeholder="Rechercher un établissement…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            onClick={() => setSearch('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {chips.map(c => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border',
              category === c.slug
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700',
            )}
          >
            {c.labelFr}
          </button>
        ))}
      </div>

      {/* Geo filters */}
      <div className="flex flex-wrap gap-2">
        <select
          className={SELECT}
          value={faritra ?? ''}
          onChange={e => { const v = e.target.value; setFaritra(v || undefined); setDistrika(undefined) }}
        >
          <option value="">Toutes les régions</option>
          {(faritraList ?? []).map(r => <option key={r.code} value={r.code}>{r.nom}</option>)}
        </select>
        <select
          className={cn(SELECT, !faritra && 'opacity-50')}
          value={distrika ?? ''}
          disabled={!faritra}
          onChange={e => { const v = e.target.value; setDistrika(v || undefined) }}
        >
          <option value="">Tous les districts</option>
          {(distrikaList ?? []).map(d => <option key={d.code} value={d.code}>{d.nom}</option>)}
        </select>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          Backend inaccessible — assurez-vous que le serveur NestJS tourne sur le port 3000.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && (
        <>
          {data.items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Aucun résultat trouvé</p>
              <p className="text-slate-400 text-sm">Essayez d'autres filtres</p>
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategory(''); setFaritra(undefined); setDistrika(undefined) }}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map(place => <PlaceCard key={place.id} place={place} />)}
            </div>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-slate-500">Page {page} / {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
