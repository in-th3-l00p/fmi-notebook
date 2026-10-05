"use server"

import { cookies } from "next/headers"
import { refresh } from "next/cache"

import { electiveOptionsFor, getGroup } from "@/lib/orar/data"
import { SETTINGS_COOKIE, type OrarSettings } from "@/lib/orar/settings"

export async function saveSettings(settings: OrarSettings) {
  const group = getGroup(settings.group)
  if (!group) return { ok: false as const }

  // keep only electives that really exist for this group, with a valid lab group
  const options = new Map(electiveOptionsFor(group).map((o) => [o.subject, o]))
  const electives = (settings.electives ?? []).flatMap((p) => {
    const opt = options.get(p.subject)
    return opt ? [{ subject: opt.subject, lab: opt.labGroups.includes(p.lab) ? p.lab : "" }] : []
  })

  const value: OrarSettings = {
    year: `${group.level}-${group.year}`,
    spec: group.spec,
    group: group.id,
    semi: /^\d$/.test(settings.semi) ? settings.semi : "",
    electives,
  }
  ;(await cookies()).set(SETTINGS_COOKIE, JSON.stringify(value), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  refresh()
  return { ok: true as const }
}
