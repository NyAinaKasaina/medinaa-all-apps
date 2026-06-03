import { cn } from '@/lib/utils'

const TYPE_CONFIG: Record<string, { label: string; classes: string }> = {
  hospital:  { label: 'Hôpital',    classes: 'bg-rose-100 text-rose-700' },
  pharmacy:  { label: 'Pharmacie',  classes: 'bg-emerald-100 text-emerald-700' },
  doctor:    { label: 'Médecin',    classes: 'bg-blue-100 text-blue-700' },
  dentist:   { label: 'Dentiste',   classes: 'bg-purple-100 text-purple-700' },
  health:    { label: 'Santé',      classes: 'bg-teal-100 text-teal-700' },
  clinic:    { label: 'Clinique',   classes: 'bg-orange-100 text-orange-700' },
  physiotherapist: { label: 'Kiné', classes: 'bg-indigo-100 text-indigo-700' },
}

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const cfg = TYPE_CONFIG[type]
  if (!cfg) return null
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.classes, className)}>
      {cfg.label}
    </span>
  )
}

export function primaryType(types?: string[]): string | undefined {
  if (!types) return undefined
  const priority = ['hospital', 'pharmacy', 'doctor', 'dentist', 'health', 'clinic', 'physiotherapist']
  return priority.find(t => types.includes(t)) ?? types[0]
}
