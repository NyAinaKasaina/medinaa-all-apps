import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RatingStars({
  rating,
  count,
  size = 'sm',
}: {
  rating?: number
  count?: number
  size?: 'sm' | 'md'
}) {
  if (rating == null) return null

  const full = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.4
  const empty = 5 - full - (hasHalf ? 1 : 0)
  const iconCls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className={cn(iconCls, 'fill-amber-400 text-amber-400')} />
      ))}
      {hasHalf && (
        <span className="relative inline-flex" style={{ width: size === 'sm' ? 14 : 16 }}>
          <Star className={cn(iconCls, 'text-slate-200 fill-slate-200')} />
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={cn(iconCls, 'fill-amber-400 text-amber-400')} />
          </span>
        </span>
      )}
      {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
        <Star key={`e${i}`} className={cn(iconCls, 'text-slate-200 fill-slate-200')} />
      ))}
      {count !== undefined && (
        <span className="ml-1 text-xs text-slate-400">({count})</span>
      )}
    </div>
  )
}
