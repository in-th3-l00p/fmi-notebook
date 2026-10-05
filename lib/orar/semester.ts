// Academic calendar for semester I, 2026–2027 (Universitatea din București).
// Teaching weeks are numbered from 1; odd weeks are "săptămâni impare" (SI),
// even weeks are "săptămâni pare" (SP). Vacation weeks are not numbered, so
// parity continues after the winter break exactly where it stopped.

export type Parity = "odd" | "even"

export type SemesterWeek = {
  /** ISO date (yyyy-mm-dd) of the Monday that starts this week. */
  monday: string
  /** Teaching week number, or null for a vacation week. */
  number: number | null
  parity: Parity | null
  label?: string
}

const FIRST_MONDAY = "2026-10-05" // week 1, an odd week
const LAST_MONDAY = "2027-01-18" // week 14

/** Mondays of weeks with no classes at all. */
const VACATION_WEEKS: Record<string, string> = {
  "2026-12-28": "Winter break",
  "2027-01-04": "Winter break",
}

/** Individual days off that fall inside teaching weeks. */
export const DAYS_OFF: Record<string, string> = {
  "2026-11-30": "St. Andrew's Day",
  "2026-12-01": "National Day",
  "2026-12-24": "Winter break",
  "2026-12-25": "Christmas",
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  const offset = (d.getUTCDay() + 6) % 7
  return addDays(iso, -offset)
}

/** Today's date in Bucharest, regardless of where the code runs. */
export function todayInBucharest(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export const SEMESTER_WEEKS: SemesterWeek[] = (() => {
  const weeks: SemesterWeek[] = []
  let n = 0
  for (let m = FIRST_MONDAY; m <= LAST_MONDAY; m = addDays(m, 7)) {
    const vacation = VACATION_WEEKS[m]
    if (vacation) {
      weeks.push({ monday: m, number: null, parity: null, label: vacation })
    } else {
      n += 1
      weeks.push({ monday: m, number: n, parity: n % 2 ? "odd" : "even" })
    }
  }
  return weeks
})()

/**
 * The week to show by default: the current one, or the next one on weekends,
 * clamped to the semester bounds.
 */
export function defaultWeekIndex(today: string): number {
  const d = new Date(`${today}T12:00:00Z`).getUTCDay()
  const target = d === 0 || d === 6 ? addDays(mondayOf(today), 7) : mondayOf(today)
  const idx = SEMESTER_WEEKS.findIndex((w) => w.monday === target)
  if (idx >= 0) return idx
  return target < SEMESTER_WEEKS[0].monday ? 0 : SEMESTER_WEEKS.length - 1
}

export function currentWeekIndex(today: string): number {
  return SEMESTER_WEEKS.findIndex((w) => w.monday === mondayOf(today))
}
