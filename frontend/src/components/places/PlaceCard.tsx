import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TypeBadge, primaryType } from './TypeBadge'
import { RatingStars } from './RatingStars'
import { cn } from '@/lib/utils'
import type { MedicalEntity } from '@/lib/api'

const STATUS_STYLES: Record<string, string> = {
  OPERATIONAL:          'bg-emerald-100 text-emerald-700',
  CLOSED_TEMPORARILY:   'bg-amber-100 text-amber-700',
  CLOSED_PERMANENTLY:   'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL:          'Ouvert',
  CLOSED_TEMPORARILY:   'Fermé temp.',
  CLOSED_PERMANENTLY:   'Fermé définitivement',
}

export function PlaceCard({ place }: { place: MedicalEntity }) {
  const navigate = useNavigate()
  const type = primaryType(place.types)
  const address = place.formattedAddress ?? place.vicinity

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all duration-150 active:scale-[0.99]"
      onClick={() => navigate(`/places/${place.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Name + type + status row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {type && <TypeBadge type={type} />}
              {place.businessStatus && (
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[place.businessStatus] ?? 'bg-slate-100 text-slate-600')}>
                  {STATUS_LABELS[place.businessStatus] ?? place.businessStatus}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
              {place.name}
            </h3>

            {address && (
              <div className="flex items-start gap-1 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 line-clamp-1">{address}</p>
              </div>
            )}

            {place.phoneNumber && (
              <div className="flex items-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-500">{place.phoneNumber}</p>
              </div>
            )}

            {place.rating != null && (
              <div className="mt-1.5">
                <RatingStars rating={place.rating} count={place.userRatingsTotal} />
              </div>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  )
}
