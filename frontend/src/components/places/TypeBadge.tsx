import { cn } from '@/lib/utils'
import { CATEGORY_CLASSES, useTypeLookup } from '@/lib/taxonomy'

const BADGE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

// Repli pour les entités encore non classifiées (tags OSM bruts).
const OSM_TYPE_CONFIG: Record<string, { label: string; classes: string }> = {
  hospital:       { label: 'Hôpital',         classes: 'bg-rose-100 text-rose-700' },
  pharmacy:       { label: 'Pharmacie',        classes: 'bg-emerald-100 text-emerald-700' },
  clinic:         { label: 'Clinique',         classes: 'bg-orange-100 text-orange-700' },
  doctors:        { label: 'Médecin',          classes: 'bg-blue-100 text-blue-700' },
  dentist:        { label: 'Dentiste',         classes: 'bg-purple-100 text-purple-700' },
  health_post:    { label: 'Poste de santé',   classes: 'bg-teal-100 text-teal-700' },
  health_facility:{ label: 'Établissement',   classes: 'bg-slate-100 text-slate-700' },
  dispensary:     { label: 'Dispensaire',      classes: 'bg-cyan-100 text-cyan-700' },
  nursing_home:   { label: 'Maison de repos',  classes: 'bg-amber-100 text-amber-700' },
  laboratory:     { label: 'Laboratoire',      classes: 'bg-indigo-100 text-indigo-700' },
  doctor:         { label: 'Médecin',          classes: 'bg-blue-100 text-blue-700' },
  nurse:          { label: 'Infirmier·e',      classes: 'bg-sky-100 text-sky-700' },
  physiotherapist:{ label: 'Kiné',             classes: 'bg-violet-100 text-violet-700' },
  midwife:        { label: 'Sage-femme',       classes: 'bg-pink-100 text-pink-700' },
  community_health_worker: { label: 'Agent de santé', classes: 'bg-lime-100 text-lime-700' },
  birthing_centre:{ label: 'Maternité',        classes: 'bg-rose-100 text-rose-700' },
}

type BadgeEntity = { typeSlug?: string | null; categorySlug?: string | null; amenity?: string; healthcare?: string }

export function TypeBadge({ entity, className }: { entity: BadgeEntity; className?: string }) {
  const lookup = useTypeLookup()

  if (entity.typeSlug) {
    const info = lookup.get(entity.typeSlug)
    const cat = entity.categorySlug ?? info?.categorySlug ?? ''
    const classes = CATEGORY_CLASSES[cat] ?? 'bg-slate-100 text-slate-700'
    return <span className={cn(BADGE, classes, className)}>{info?.label ?? entity.typeSlug}</span>
  }

  const osm = primaryType(entity)
  const cfg = osm ? OSM_TYPE_CONFIG[osm] : undefined
  if (!cfg) {
    return <span className={cn(BADGE, 'bg-slate-100 text-slate-500', className)}>À classifier</span>
  }
  return <span className={cn(BADGE, cfg.classes, className)}>{cfg.label}</span>
}

export function primaryType(entity: { amenity?: string; healthcare?: string }): string | undefined {
  const priority = ['hospital', 'pharmacy', 'clinic', 'doctors', 'dentist', 'health_post', 'dispensary', 'laboratory', 'nursing_home', 'health_facility']
  return priority.find(t => t === entity.amenity || t === entity.healthcare)
    ?? entity.amenity
    ?? entity.healthcare
}
