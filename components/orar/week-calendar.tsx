"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ClassEvent, ClassKind } from "@/lib/orar/data"
import {
  DAYS_OFF,
  SEMESTER_WEEKS,
  type SemesterWeek,
  addDays,
  currentWeekIndex,
  defaultWeekIndex,
} from "@/lib/orar/semester"
import { cn } from "@/lib/utils"

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const FIRST_HOUR = 8
const LAST_HOUR = 20
const HOUR_PX = 64

const KIND_LABEL: Record<ClassKind, string> = {
  curs: "Lecture",
  seminar: "Seminar",
  lab: "Lab",
  proiect: "Project",
}

// Soft, cool pastels with a darker edge for each subject.
const TINTS = [
  { bg: "oklch(0.955 0.025 250)", edge: "oklch(0.5 0.1 255)" },
  { bg: "oklch(0.955 0.03 160)", edge: "oklch(0.5 0.08 160)" },
  { bg: "oklch(0.955 0.025 300)", edge: "oklch(0.5 0.09 300)" },
  { bg: "oklch(0.96 0.03 200)", edge: "oklch(0.5 0.07 210)" },
  { bg: "oklch(0.955 0.025 350)", edge: "oklch(0.5 0.1 0)" },
  { bg: "oklch(0.96 0.03 130)", edge: "oklch(0.5 0.08 135)" },
  { bg: "oklch(0.955 0.02 275)", edge: "oklch(0.45 0.08 275)" },
]

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
const fmt = (f: Intl.DateTimeFormat, iso: string) => f.format(new Date(`${iso}T12:00:00Z`))

function runsInWeek(e: ClassEvent, week: SemesterWeek) {
  if (week.number === null) return false
  if (e.parity && e.parity !== week.parity) return false
  if (e.weeks && (week.number < e.weeks[0] || week.number > e.weeks[1])) return false
  return true
}

type Placed = ClassEvent & { lane: number; lanes: number }

/** Side-by-side lanes for classes that overlap (e.g. both subgroups at once). */
function layoutDay(events: ClassEvent[]): Placed[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((e) => e.lane + 1))
    cluster.forEach((e) => (e.lanes = lanes))
    out.push(...cluster)
    cluster = []
  }
  for (const e of sorted) {
    if (e.start >= clusterEnd) {
      flush()
      clusterEnd = -1
    }
    const used = new Set(cluster.filter((c) => c.end > e.start).map((c) => c.lane))
    let lane = 0
    while (used.has(lane)) lane++
    cluster.push({ ...e, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, e.end)
  }
  flush()
  return out
}

function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 30_000)
  return () => clearInterval(id)
}

export function WeekCalendar({ events, today }: { events: ClassEvent[]; today: string }) {
  const [weekIdx, setWeekIdx] = useState(() => defaultWeekIndex(today))
  const nowIdx = currentWeekIndex(today)
  const week = SEMESTER_WEEKS[weekIdx]
  const dates = DAY_NAMES.map((_, i) => addDays(week.monday, i))
  const todayCol = dates.indexOf(today)

  const minutes = useSyncExternalStore(
    subscribeMinute,
    () => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Bucharest",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date())
      const [h, m] = parts.split(":").map(Number)
      return h * 60 + m
    },
    () => null
  )

  const tintOf = useMemo(() => {
    const subjects = [...new Set(events.map((e) => e.subject))].sort()
    return (s: string) => TINTS[subjects.indexOf(s) % TINTS.length]
  }, [events])

  const byDay = useMemo(
    () =>
      DAY_NAMES.map((_, d) =>
        DAYS_OFF[dates[d]] ? [] : layoutDay(events.filter((e) => e.day === d && runsInWeek(e, week)))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, weekIdx]
  )
  const hours = byDay.flat().reduce((sum, e) => sum + (e.end - e.start), 0)

  return (
    <div className="grid gap-8">
      {/* the semester at a glance */}
      <div className="-mx-6 overflow-x-auto px-6 pt-6 pb-2">
        <ToggleGroup
          type="single"
          value={String(weekIdx)}
          onValueChange={(v) => v && setWeekIdx(Number(v))}
          spacing={1}
          className="mx-auto"
          aria-label="Semester weeks"
        >
          {SEMESTER_WEEKS.map((w, i) => (
            <ToggleGroupItem
              key={w.monday}
              value={String(i)}
              aria-label={w.number ? `Week ${w.number}` : w.label}
              className={cn(
                "relative h-14 w-14 flex-col gap-0.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
                i === nowIdx && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                w.number === null && "text-muted-foreground"
              )}
            >
              {i === nowIdx && (
                <span className="absolute -top-6 text-xs font-semibold whitespace-nowrap text-primary">
                  This week
                </span>
              )}
              <span className="text-base leading-none font-semibold tabular">{w.number ?? "–"}</span>
              <span className="text-[0.7rem] opacity-75">{w.parity ?? "break"}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* this week's heading */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {fmt(longDate, week.monday)} – {fmt(longDate, addDays(week.monday, 4))}
          </p>
          <h2 className="mt-1 flex items-center gap-3 font-serif text-3xl font-medium">
            {week.number ? (
              <>
                Week {week.number}
                <Badge variant="secondary" className="font-sans text-sm">
                  {week.parity === "odd" ? "Odd" : "Even"} week
                </Badge>
              </>
            ) : (
              week.label
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {week.number !== null && (
            <span className="mr-2 text-sm text-muted-foreground tabular">
              {hours} {hours === 1 ? "hour" : "hours"} of classes
            </span>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous week"
            disabled={weekIdx === 0}
            onClick={() => setWeekIdx((i) => i - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" disabled={weekIdx === nowIdx || nowIdx < 0} onClick={() => setWeekIdx(nowIdx)}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next week"
            disabled={weekIdx === SEMESTER_WEEKS.length - 1}
            onClick={() => setWeekIdx((i) => i + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {week.number === null ? (
        <div className="grid place-items-center gap-3 py-10 text-center">
          <Image src="/art/watch.png" alt="" width={1008} height={616} className="graphite w-64" />
          <p className="font-serif text-3xl font-medium">{week.label}</p>
          <p className="text-muted-foreground">No classes this week.</p>
        </div>
      ) : (
        <>
          {/* desktop: the whole week */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[3.5rem_repeat(5,1fr)]">
              <div />
              {dates.map((date, d) => (
                <div key={date} className="px-2 pb-3 text-center">
                  <div className={cn("font-semibold", d === todayCol && "text-primary")}>{DAY_NAMES[d]}</div>
                  <div
                    className={cn(
                      "mx-auto mt-1 w-fit rounded-full px-2 text-sm text-muted-foreground tabular",
                      d === todayCol && "bg-primary text-primary-foreground"
                    )}
                  >
                    {fmt(shortDate, date)}
                  </div>
                </div>
              ))}

              <div className="relative" style={{ height: (LAST_HOUR - FIRST_HOUR) * HOUR_PX }}>
                {Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => (
                  <span
                    key={i}
                    className="absolute right-3 -translate-y-1/2 text-sm text-muted-foreground tabular"
                    style={{ top: i * HOUR_PX }}
                  >
                    {FIRST_HOUR + i}:00
                  </span>
                ))}
              </div>

              {byDay.map((list, d) => (
                <div
                  key={d}
                  className={cn("relative border-l", d === 4 && "border-r", d === todayCol && "bg-primary/[0.03]")}
                  style={{
                    height: (LAST_HOUR - FIRST_HOUR) * HOUR_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_PX}px)`,
                  }}
                >
                  {DAYS_OFF[dates[d]] && (
                    <div className="absolute inset-0 grid place-items-center bg-muted/80 text-center">
                      <div>
                        <div className="font-semibold">Day off</div>
                        <div className="text-sm text-muted-foreground">{DAYS_OFF[dates[d]]}</div>
                      </div>
                    </div>
                  )}
                  {list.map((e, i) => (
                    <EventBlock key={i} event={e} tint={tintOf(e.subject)} />
                  ))}
                  {d === todayCol && minutes !== null && minutes >= FIRST_HOUR * 60 && minutes <= LAST_HOUR * 60 && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: ((minutes - FIRST_HOUR * 60) / 60) * HOUR_PX }}
                    >
                      <span className="-ml-1 size-2 rounded-full bg-destructive" />
                      <span className="h-px flex-1 bg-destructive" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* phone: one day at a time */}
          <Tabs defaultValue={String(todayCol >= 0 ? todayCol : 0)} key={weekIdx} className="md:hidden">
            <TabsList className="w-full">
              {dates.map((date, d) => (
                <TabsTrigger key={date} value={String(d)}>
                  {DAY_NAMES[d].slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
            {byDay.map((list, d) => (
              <TabsContent key={d} value={String(d)} className="grid gap-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  {DAY_NAMES[d]}, {fmt(longDate, dates[d])}
                </p>
                {DAYS_OFF[dates[d]] ? (
                  <p className="py-10 text-center text-muted-foreground">Day off: {DAYS_OFF[dates[d]]}</p>
                ) : list.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">No classes.</p>
                ) : (
                  list.map((e, i) => <EventRow key={i} event={e} tint={tintOf(e.subject)} />)
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  )
}

type Tint = (typeof TINTS)[number]

function meta(e: ClassEvent) {
  return [
    e.elective && (e.elective === "optional" ? "Optional" : "Facultative"),
    e.kind && KIND_LABEL[e.kind],
    e.semi && (e.elective ? `Lab group ${e.semi}` : `Subgroup ${e.semi}`),
  ]
    .filter(Boolean)
    .join(" · ")
}

function EventBlock({ event: e, tint }: { event: Placed; tint: Tint }) {
  const height = (e.end - e.start) * HOUR_PX
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className="absolute overflow-hidden rounded-md border-l-[3px] px-2.5 py-2 text-left outline-none hover:z-20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            top: (e.start - FIRST_HOUR) * HOUR_PX + 2,
            height: height - 4,
            left: `calc(${(e.lane / e.lanes) * 100}% + 3px)`,
            width: `calc(${100 / e.lanes}% - 6px)`,
            background: tint.bg,
            borderColor: tint.edge,
          }}
        >
          <div className="text-sm leading-tight font-semibold">{e.subject}</div>
          {meta(e) && <div className="mt-0.5 truncate text-xs text-foreground/70">{meta(e)}</div>}
          {height > 70 && (
            <div className="mt-1 truncate text-xs text-foreground/70 tabular">
              {e.start}:00–{e.end}:00 · {e.room}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        <EventDetails event={e} />
      </TooltipContent>
    </Tooltip>
  )
}

function EventRow({ event: e, tint }: { event: ClassEvent; tint: Tint }) {
  return (
    <div className="flex gap-4 rounded-md border-l-[3px] px-4 py-3" style={{ background: tint.bg, borderColor: tint.edge }}>
      <div className="w-12 shrink-0 tabular">
        <div className="font-semibold">{e.start}:00</div>
        <div className="text-sm text-muted-foreground">{e.end}:00</div>
      </div>
      <EventDetails event={e} />
    </div>
  )
}

function EventDetails({ event: e }: { event: ClassEvent }) {
  return (
    <div className="grid gap-0.5 text-sm">
      <div className="font-semibold">{e.subject}</div>
      {meta(e) && <div>{meta(e)}</div>}
      <div className="tabular">
        {e.start}:00 – {e.end - 1}:50{e.room && ` · ${e.room}`}
      </div>
      {e.teacher && <div>{e.teacher}</div>}
      {e.parity && <div>{e.parity === "odd" ? "Odd" : "Even"} weeks only</div>}
      {e.weeks && (
        <div>
          Weeks {e.weeks[0]}–{e.weeks[1]} only
        </div>
      )}
    </div>
  )
}
