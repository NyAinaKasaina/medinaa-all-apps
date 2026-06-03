import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Phone, Globe, Clock, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TypeBadge, primaryType } from '@/components/places/TypeBadge'
import { RatingStars } from '@/components/places/RatingStars'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  OPERATIONAL:        'text-emerald-700 bg-emerald-50',
  CLOSED_TEMPORARILY: 'text-amber-700 bg-amber-50',
  CLOSED_PERMANENTLY: 'text-red-700 bg-red-50',
}
const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL:        'Ouvert',
  CLOSED_TEMPORARILY: 'Fermé temporairement',
  CLOSED_PERMANENTLY: 'Fermé définitivement',
}

export function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', id],
    queryFn: () => api.places.get(id!),
    enabled: !!id,
  })

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>

      {isError && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          Entité introuvable ou backend inaccessible.
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Card><CardContent className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </CardContent></Card>
        </div>
      )}

      {place && (
        <>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              {primaryType(place.types) && <TypeBadge type={primaryType(place.types)!} />}
              {place.businessStatus && (
                <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', STATUS_STYLES[place.businessStatus] ?? 'bg-slate-100 text-slate-600')}>
                  {STATUS_LABELS[place.businessStatus] ?? place.businessStatus}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{place.name}</h1>
            {place.rating != null && (
              <RatingStars rating={place.rating} count={place.userRatingsTotal} size="md" />
            )}
          </div>

          {/* Info card */}
          <Card>
            <CardContent className="p-4 divide-y divide-slate-100">
              {(place.formattedAddress ?? place.vicinity) && (
                <InfoRow icon={MapPin} label="Adresse">
                  {place.formattedAddress ?? place.vicinity}
                </InfoRow>
              )}
              {place.phoneNumber && (
                <InfoRow icon={Phone} label="Téléphone">
                  <a href={`tel:${place.phoneNumber}`} className="text-emerald-600 hover:underline">
                    {place.phoneNumber}
                  </a>
                </InfoRow>
              )}
              {place.internationalPhoneNumber && place.internationalPhoneNumber !== place.phoneNumber && (
                <InfoRow icon={Phone} label="International">
                  <a href={`tel:${place.internationalPhoneNumber}`} className="text-emerald-600 hover:underline">
                    {place.internationalPhoneNumber}
                  </a>
                </InfoRow>
              )}
              {place.website && (
                <InfoRow icon={Globe} label="Site web">
                  <a href={place.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate max-w-[220px] inline-block">
                    {place.website.replace(/^https?:\/\//, '')}
                  </a>
                </InfoRow>
              )}
              {place.openingHours?.weekday_text && place.openingHours.weekday_text.length > 0 && (
                <InfoRow icon={Clock} label="Horaires" align="start">
                  <div className="space-y-0.5">
                    {place.openingHours.weekday_text.map((line, i) => (
                      <p key={i} className="text-sm text-slate-600">{line}</p>
                    ))}
                  </div>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* All types */}
          {(place.types?.length ?? 0) > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {place.types!.map(t => <TypeBadge key={t} type={t} />)}
            </div>
          )}

          {/* Google Maps button */}
          {(place.googleMapsUrl ?? (place.lat && place.lng)) && (
            <a
              href={place.googleMapsUrl ?? `https://maps.google.com/?q=${place.lat},${place.lng}`}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4" />
                Voir sur Google Maps
              </Button>
            </a>
          )}

          {/* Coordinates */}
          {place.lat && place.lng && (
            <p className="text-xs text-slate-400 text-center">
              {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
  align = 'center',
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
  align?: 'center' | 'start'
}) {
  return (
    <div className={`flex gap-3 py-3 first:pt-0 last:pb-0 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  )
}
