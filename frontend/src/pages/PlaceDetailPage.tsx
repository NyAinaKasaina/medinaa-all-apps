import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Phone, Globe, Clock, ExternalLink, AlertCircle, Bed, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TypeBadge } from '@/components/places/TypeBadge'
import { api } from '@/lib/api'

export function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', id],
    queryFn: () => api.places.get(id!),
    enabled: !!id,
  })

  const displayName = place?.name ?? place?.nameMg ?? '(Sans nom)'
  const fullAddress = [
    place?.addrHousenumber,
    place?.addrStreet,
    place?.addrCity,
    place?.addrDistrict,
    place?.addrProvince,
  ].filter(Boolean).join(', ')

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
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <TypeBadge entity={place} />
              {place.emergency && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Urgences 24h</span>
              )}
              {place.operatorType && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{place.operatorType}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
            {place.nameMg && place.name && (
              <p className="text-sm text-slate-500 italic">{place.nameMg}</p>
            )}
          </div>

          <Card>
            <CardContent className="p-4 divide-y divide-slate-100">
              {fullAddress && (
                <InfoRow icon={MapPin} label="Adresse">{fullAddress}</InfoRow>
              )}
              {place.phone && (
                <InfoRow icon={Phone} label="Téléphone">
                  <a href={`tel:${place.phone}`} className="text-emerald-600 hover:underline">{place.phone}</a>
                </InfoRow>
              )}
              {place.website && (
                <InfoRow icon={Globe} label="Site web">
                  <a href={place.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate max-w-[220px] inline-block">
                    {place.website.replace(/^https?:\/\//, '')}
                  </a>
                </InfoRow>
              )}
              {place.openingHours && (
                <InfoRow icon={Clock} label="Horaires">
                  <span className="font-mono text-sm">{place.openingHours}</span>
                </InfoRow>
              )}
              {place.operator && (
                <InfoRow icon={Stethoscope} label="Opérateur">{place.operator}</InfoRow>
              )}
              {place.beds && (
                <InfoRow icon={Bed} label="Capacité">{place.beds} lits</InfoRow>
              )}
            </CardContent>
          </Card>

          {place.osmUrl && (
            <a href={place.osmUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4" />
                Voir sur OpenStreetMap
              </Button>
            </a>
          )}

          {place.lat && place.lng && (
            <a href={`https://maps.google.com/?q=${place.lat},${place.lng}`} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm" className="w-full text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
              </Button>
            </a>
          )}
        </>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0 items-start">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  )
}
