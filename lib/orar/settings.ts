import "server-only"

import { cookies } from "next/headers"

export const SETTINGS_COOKIE = "fmi-orar"

export type OrarSettings = {
  /** "licenta-2", "master-1", … */
  year: string
  spec: string
  group: string
  /** "" means the whole group (both semigroups). */
  semi: string
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
    }
  } catch {
    return null
  }
}
