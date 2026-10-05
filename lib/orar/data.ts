import "server-only"

import raw from "./orar.json"
import type { Parity } from "./semester"

export type ClassKind = "curs" | "seminar" | "lab" | "proiect"

export type ClassEvent = {
  /** 0 = Monday … 4 = Friday */
  day: number
  /** Start hour; classes run from start:00 to end:00 (minus the 10' break). */
  start: number
  end: number
  subject: string
  teacher: string
  room: string
  kind?: ClassKind
  /** Semigroup ("1", "2", …) when only part of the group attends. */
  semi?: string
  /** Only in odd (SI) or even (SP) weeks. */
  parity?: Parity
  /** Only within this inclusive range of teaching weeks. */
  weeks?: [number, number]
  /** Lecture series of an elective ("seria_4"). */
  series?: string
  /** Set on classes that come from an optional or facultative course the student picked. */
  elective?: ElectiveKind
}

export type ElectiveKind = "optional" | "facultative"

export type Level = "licenta" | "master"

export type Group = {
  id: string
  level: Level
  year: number
  spec: string
  specLabel: string
  events: ClassEvent[]
}

export type GroupMeta = Omit<Group, "events"> & { semis: string[]; electives: ElectiveOption[] }

type ElectivePage = {
  title: string
  kind: ElectiveKind
  level: Level
  year: number
  specs: string[]
  events: ClassEvent[]
}

/** A course a student can opt into, and the lab groups it is split into (if any). */
export type ElectiveOption = { subject: string; kind: ElectiveKind; labGroups: string[] }

/** What a student picked: the subject and, optionally, the one lab group they attend. */
export type ElectivePick = { subject: string; lab: string }

const data = raw as { source: string; generated: string; groups: Group[]; electives: ElectivePage[] }

export const SCHEDULE_SOURCE = data.source
export const SCHEDULE_GENERATED = data.generated

export function getGroup(id: string): Group | undefined {
  return data.groups.find((g) => g.id === id)
}

/** Everything the settings form needs, without the (heavier) events. */
export function getGroupIndex(): GroupMeta[] {
  return data.groups.map(({ events, ...meta }) => ({
    ...meta,
    semis: [...new Set(events.flatMap((e) => (e.semi ? [e.semi] : [])))].sort(),
    electives: electiveOptionsFor(meta),
  }))
}

function electivePagesFor(g: Pick<Group, "level" | "year" | "spec">) {
  return data.electives.filter((p) => p.level === g.level && p.year === g.year && p.specs.includes(g.spec))
}

/** Every elective available to a group, merged across pages (a course and its labs can live on different pages). */
export function electiveOptionsFor(g: Pick<Group, "level" | "year" | "spec">): ElectiveOption[] {
  const bySubject = new Map<string, ElectiveOption>()
  for (const page of electivePagesFor(g)) {
    for (const e of page.events) {
      const opt = bySubject.get(e.subject) ?? { subject: e.subject, kind: page.kind, labGroups: [] }
      if (e.semi && !opt.labGroups.includes(e.semi)) opt.labGroups.push(e.semi)
      bySubject.set(e.subject, opt)
    }
  }
  return [...bySubject.values()]
    .map((o) => ({ ...o, labGroups: o.labGroups.sort() }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.subject.localeCompare(b.subject))
}

/** Classes of the electives a student picked, limited to their lab group when they chose one. */
export function electiveEventsFor(g: Pick<Group, "level" | "year" | "spec">, picks: ElectivePick[]): ClassEvent[] {
  const chosen = new Map(picks.map((p) => [p.subject, p.lab]))
  return electivePagesFor(g).flatMap((page) =>
    page.events
      .filter((e) => {
        if (!chosen.has(e.subject)) return false
        const lab = chosen.get(e.subject)
        return !lab || !e.semi || e.semi === lab
      })
      .map((e) => ({ ...e, elective: page.kind }))
  )
}
