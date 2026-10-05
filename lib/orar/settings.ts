import "server-only"

import { cookies } from "next/headers"

import type { ElectivePick } from "./data"

export const SETTINGS_COOKIE = "fmi-orar"

export type OrarSettings = {
  /** "licenta-2", "master-1", … */
  year: string
  spec: string
  group: string
  /** "" means the whole group (both semigroups). */
  semi: string
  /** Optional / facultative courses the student takes. */
  electives: ElectivePick[]
}

export async function readSettings(): Promise<OrarSettings | null> {
  const value = (await cookies()).get(SETTINGS_COOKIE)?.value
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<OrarSettings>
    if (!parsed.group) return null
    return {
      year: parsed.year ?? "",
      spec: parsed.spec ?? "",
      group: parsed.group,
      semi: parsed.semi ?? "",
      electives: Array.isArray(parsed.electives) ? parsed.electives : [],
    }
  } catch {
    return null
  }
}
