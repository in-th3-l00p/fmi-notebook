"use server"

import { cookies } from "next/headers"
import { refresh } from "next/cache"

import { getGroup } from "@/lib/orar/data"
import { SETTINGS_COOKIE, type OrarSettings } from "@/lib/orar/settings"

export async function saveSettings(settings: OrarSettings) {
  const group = getGroup(settings.group)
  if (!group) return { ok: false as const }

  const value: OrarSettings = {
    year: `${group.level}-${group.year}`,
    spec: group.spec,
    group: group.id,
    semi: /^\d$/.test(settings.semi) ? settings.semi : "",
  }
  ;(await cookies()).set(SETTINGS_COOKIE, JSON.stringify(value), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  refresh()
  return { ok: true as const }
}
