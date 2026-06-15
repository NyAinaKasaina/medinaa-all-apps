import { useEffect, useRef } from 'react'
import { Navigation, Clock, Phone, X, MapPin, Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlaceFeature } from '@/lib/api'

interface EntityModalProps {
  feature: PlaceFeature
  typeLabel: string
  statusLabel: string | null // ex. 'Ouvert · ferme à 18:00' — null si horaires absents
  statusOpen: boolean | null // true ouvert / false fermé / null inconnu
  route: { km: number; min: number } | null
  hasOrigin: boolean // une origine est définie (ma position OU point choisi)
  onClose: () => void
  onItinerary: () => void // calcule l'itinéraire depuis l'origine courante
  onUseMyLocation: () => void // définit l'origine = géolocalisation
  onPickOnMap: () => void // ferme la modale et active le choix d'un point sur la carte
}

export function EntityModal({
  feature, typeLabel, statusLabel, statusOpen, route,
  hasOrigin, onClose, onItinerary, onUseMyLocation, onPickOnMap,
}: EntityModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = `entity-modal-${feature.properties.id}`
  const name = feature.properties.name ?? '(Sans nom)'
  const phone = feature.properties.phone

  // Échap pour fermer + blocage du scroll du fond + focus initial. Un seul effet : on
  // verrouille au montage, on restaure au démontage (cleanup).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const status = {
    open: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    closed: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
    unknown: { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  }[statusOpen === true ? 'open' : statusOpen === false ? 'closed' : 'unknown']

  const statusText = statusLabel ?? (statusOpen === null ? 'Horaires inconnus' : statusOpen ? 'Ouvert' : 'Fermé')

  return (
    // Overlay plein écran. Clic backdrop = fermer. Feuille basse (mobile) -> carte centrée (desktop).
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-10 w-full bg-white shadow-2xl outline-none',
          'rounded-t-2xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          'sm:w-full sm:max-w-md sm:rounded-2xl sm:p-6 sm:pb-6 sm:mx-4',
          'max-h-[85dvh] overflow-y-auto',
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id={titleId} className="pr-8 text-lg font-bold leading-snug text-slate-900">{name}</h2>
        {typeLabel && <p className="mt-0.5 text-sm text-slate-500">{typeLabel}</p>}

        <div className={cn('mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium', status.bg, status.text)}>
          <span className={cn('h-2 w-2 rounded-full', status.dot)} aria-hidden="true" />
          <Clock className="h-3.5 w-3.5" />
          {statusText}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          {phone ? (
            <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-sm font-medium text-emerald-700 hover:text-emerald-800">
              <Phone className="h-4 w-4 shrink-0" />{phone}
            </a>
          ) : (
            <p className="flex items-center gap-2.5 text-sm text-slate-400">
              <Phone className="h-4 w-4 shrink-0" />Numéro non renseigné
            </p>
          )}
          {route && (
            <p className="mt-2 flex items-center gap-2.5 text-sm font-medium text-blue-600">
              <Navigation className="h-4 w-4 shrink-0" />{route.km.toFixed(1)} km · {Math.round(route.min)} min
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {hasOrigin ? (
            <button
              onClick={onItinerary}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800"
            >
              <Navigation className="h-4 w-4" /> Itinéraire
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onUseMyLocation}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800"
              >
                <Crosshair className="h-4 w-4" /> Ma position
              </button>
              <button
                onClick={onPickOnMap}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4" /> Sur la carte
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        {!hasOrigin && (
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Choisis un point de départ (ta position ou un point sur la carte) pour l'itinéraire.
          </p>
        )}
      </div>
    </div>
  )
}
