// "Ouvert maintenant ?" + statut détaillé (prochain changement) — best-effort sur
// les 2 formats présents en base :
//  - Google FR : "lundi: 07:30 – 19:00, 14:30 – 18:00; …; dimanche: Fermé" (+ "Ouvert 24h/24")
//  - OSM       : "Mo-Sa 08:00-18:00", "Mo-Fr 08:00-12:00; Mo-Fr 14:00-18:00", "24/7"

const FR_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] // getDay() 0..6
const OSM_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Interval {
  open: number // minutes depuis minuit, inclus
  close: number // minutes depuis minuit, exclus
}

// Représentation intermédiaire commune : 7 jours (index 0 = dimanche, comme getDay()),
// chaque jour = liste d'intervalles triés. `alwaysOpen` couvre 24/7 et "Ouvert 24h/24".
interface Schedule {
  days: Interval[][] // longueur 7
  alwaysOpen: boolean
}

const toMin = (h: number, m: number) => h * 60 + m
const emptyDays = (): Interval[][] => [[], [], [], [], [], [], []]
const sortDay = (intervals: Interval[]): Interval[] => intervals.slice().sort((x, y) => x.open - y.open || x.close - y.close)

function dayRange(a: number, b: number): number[] {
  const out: number[] = []
  let i = a
  for (;;) { out.push(i); if (i === b) break; i = (i + 1) % 7 }
  return out
}

function parseFr(hours: string): Schedule | null {
  const days = emptyDays()
  let parsedAny = false
  for (const seg of hours.split(';').map((s) => s.trim())) {
    const colon = seg.indexOf(':')
    if (colon < 0) continue
    const dow = FR_DAYS.indexOf(seg.slice(0, colon).trim().toLowerCase())
    if (dow < 0) continue
    const val = seg.slice(colon + 1).trim()
    parsedAny = true
    if (/24\s*h|24\/24/i.test(val)) return { days: emptyDays(), alwaysOpen: true }
    if (/ferm/i.test(val)) continue // jour fermé : aucun intervalle
    for (const r of val.split(',')) {
      const m = r.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
      if (m) days[dow].push({ open: toMin(+m[1], +m[2]), close: toMin(+m[3], +m[4]) })
    }
  }
  if (!parsedAny) return null
  return { days: days.map(sortDay), alwaysOpen: false }
}

function parseOsm(hours: string): Schedule | null {
  if (hours.includes('24/7')) return { days: emptyDays(), alwaysOpen: true }
  const days = emptyDays()
  let parsedAny = false
  for (const rule of hours.split(';').map((s) => s.trim())) {
    const mr = rule.match(/^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
    const ms = rule.match(/^([A-Za-z]{2})\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
    let targetDays: number[] | null = null, open = 0, close = 0
    if (mr) {
      const a = OSM_DAYS.indexOf(mr[1]), b = OSM_DAYS.indexOf(mr[2])
      if (a < 0 || b < 0) continue
      targetDays = dayRange(a, b); open = toMin(+mr[3], +mr[4]); close = toMin(+mr[5], +mr[6])
    } else if (ms) {
      const a = OSM_DAYS.indexOf(ms[1])
      if (a < 0) continue
      targetDays = [a]; open = toMin(+ms[2], +ms[3]); close = toMin(+ms[4], +ms[5])
    } else continue
    parsedAny = true
    for (const d of targetDays) days[d].push({ open, close })
  }
  if (!parsedAny) return null
  return { days: days.map(sortDay), alwaysOpen: false }
}

// Représentation intermédiaire commune. null = pas d'horaires ou format non reconnu / non parsable.
export function parseHours(hours?: string | null): Schedule | null {
  if (!hours) return null
  if (/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i.test(hours)) return parseFr(hours)
  return parseOsm(hours)
}

export function isOpenNow(hours?: string | null, now: Date = new Date()): boolean | null {
  const schedule = parseHours(hours)
  if (!schedule) return null
  if (schedule.alwaysOpen) return true
  const dow = now.getDay()
  const cur = toMin(now.getHours(), now.getMinutes())
  for (const { open, close } of schedule.days[dow]) {
    if (cur >= open && cur < close) return true
  }
  return false
}

export interface OpeningStatus {
  open: boolean
  label: string
  until?: string
}

const hhmm = (min: number): string => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Statut + prochain changement, prêt pour l'UI. null = horaires absents/non parsables.
export function openingStatus(hours?: string | null, now: Date = new Date()): OpeningStatus | null {
  const schedule = parseHours(hours)
  if (!schedule) return null
  if (schedule.alwaysOpen) return { open: true, label: 'Ouvert 24h/24' }

  const dow = now.getDay()
  const cur = toMin(now.getHours(), now.getMinutes())

  // Ouvert maintenant -> annonce l'heure de fermeture (fin de l'intervalle courant).
  for (const { open, close } of schedule.days[dow]) {
    if (cur >= open && cur < close) {
      const until = hhmm(close)
      return { open: true, until, label: `Ouvert · ferme à ${until}` }
    }
  }

  // Fermé -> cherche la prochaine ouverture (aujourd'hui d'abord, puis jours suivants, max 7).
  for (let offset = 0; offset < 7; offset++) {
    const day = (dow + offset) % 7
    for (const { open } of schedule.days[day]) {
      if (offset === 0 && open <= cur) continue // intervalle déjà passé aujourd'hui
      const time = hhmm(open)
      if (offset === 0) return { open: false, until: time, label: `Fermé · ouvre à ${time}` }
      const dayName = FR_DAYS[day]
      return { open: false, until: `${dayName} ${time}`, label: `Fermé · ouvre ${dayName} à ${time}` }
    }
  }

  // Aucune ouverture sur 7 jours.
  return { open: false, label: 'Fermé' }
}
