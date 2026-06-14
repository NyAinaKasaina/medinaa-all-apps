// "Ouvert maintenant ?" — best-effort sur les 2 formats présents en base :
//  - Google FR : "lundi: 07:30 – 19:00, 14:30 – 18:00; …; dimanche: Fermé" (+ "Ouvert 24h/24")
//  - OSM       : "Mo-Sa 08:00-18:00", "24/7"
// Retourne true/false, ou null si pas d'horaires / non parsable.

const FR_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] // getDay() 0..6
const OSM_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const toMin = (h: number, m: number) => h * 60 + m

function inAnyFrRange(val: string, cur: number): boolean {
  for (const r of val.split(',')) {
    const m = r.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
    if (m && cur >= toMin(+m[1], +m[2]) && cur < toMin(+m[3], +m[4])) return true
  }
  return false
}
function dayRange(a: number, b: number): number[] {
  const out: number[] = []
  let i = a
  for (;;) { out.push(i); if (i === b) break; i = (i + 1) % 7 }
  return out
}

export function isOpenNow(hours?: string | null, now: Date = new Date()): boolean | null {
  if (!hours) return null
  const dow = now.getDay()
  const cur = toMin(now.getHours(), now.getMinutes())

  // Google FR
  if (/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i.test(hours)) {
    const seg = hours.split(';').map((s) => s.trim()).find((s) => s.toLowerCase().startsWith(FR_DAYS[dow]))
    if (!seg) return null
    const val = seg.slice(seg.indexOf(':') + 1).trim()
    if (/ferm/i.test(val)) return false
    if (/24\s*h|24\/24/i.test(val)) return true
    return inAnyFrRange(val, cur)
  }

  // OSM
  if (hours.includes('24/7')) return true
  let parsedAny = false
  for (const rule of hours.split(';').map((s) => s.trim())) {
    const mr = rule.match(/^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
    const ms = rule.match(/^([A-Za-z]{2})\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
    let days: number[] | null = null, o = 0, c = 0
    if (mr) {
      const a = OSM_DAYS.indexOf(mr[1]), b = OSM_DAYS.indexOf(mr[2])
      if (a < 0 || b < 0) continue
      days = dayRange(a, b); o = toMin(+mr[3], +mr[4]); c = toMin(+mr[5], +mr[6])
    } else if (ms) {
      const a = OSM_DAYS.indexOf(ms[1])
      if (a < 0) continue
      days = [a]; o = toMin(+ms[2], +ms[3]); c = toMin(+ms[4], +ms[5])
    } else continue
    parsedAny = true
    if (days.includes(dow) && cur >= o && cur < c) return true
  }
  return parsedAny ? false : null
}
