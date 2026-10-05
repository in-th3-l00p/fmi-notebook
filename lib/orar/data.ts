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
}

export type Level = "licenta" | "master"

export type Group = {
  id: string
  level: Level
  year: number
  spec: string
  specLabel: string
  events: ClassEvent[]
}

export type GroupMeta = Omit<Group, "events"> & { semis: string[] }

const data = raw as { source: string; generated: string; groups: Group[] }

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
  }))
}
