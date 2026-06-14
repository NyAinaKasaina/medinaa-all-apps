import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TypeBadge } from './TypeBadge'
import { useFaritraLabel, prettyGeo } from '@/lib/geo'
import type { MedicalEntity } from '@/lib/api'

export function PlaceCard({ place }: { place: MedicalEntity }) {
  const navigate = useNavigate()
  const faritraLabel = useFaritraLabel()
  const displayName = place.name ?? place.nameMg ?? '(Sans nom)'
  const region = place.codeFaritra ? prettyGeo(faritraLabel.get(place.codeFaritra)) : ''
  const address = [place.addrStreet, place.addrCity].filter(Boolean).join(', ') || place.addrDistrict

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all duration-150 active:scale-[0.99] h-full"
      onClick={() => navigate(`/places/${place.id}`)}
    >
      <CardContent className="p-4 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <TypeBadge entity={place} />
              {place.classificationStatus === 'unverified' && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                  À classifier
                </span>
              )}
              {place.emergency && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                  Urgences
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-900 text-sm leading-snug">
              {displayName}
            </h3>

            {region && (
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-500 line-clamp-1">{region}</p>
              </div>
            )}
            {address && (
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{address}</p>
            )}

            {place.phone && (
              <div className="flex items-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-500">{place.phone}</p>
              </div>
            )}

            {place.operator && (
              <p className="text-xs text-slate-400 mt-1 truncate">Opérateur : {place.operator}</p>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  )
}
