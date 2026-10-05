import type { Metadata } from "next"
import Image from "next/image"

import { SettingsForm } from "@/components/orar/settings-form"
import { SettingsSheet } from "@/components/orar/settings-sheet"
import { WeekCalendar } from "@/components/orar/week-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SCHEDULE_GENERATED, SCHEDULE_SOURCE, getGroup, getGroupIndex } from "@/lib/orar/data"
import { todayInBucharest } from "@/lib/orar/semester"
import { readSettings } from "@/lib/orar/settings"

export const metadata: Metadata = {
  title: "Schedule",
  description: "The FMI timetable for your group, week by week.",
}

const ROMAN = ["", "I", "II", "III", "IV"]

export default async function SchedulePage() {
  const settings = await readSettings()
  const group = settings ? getGroup(settings.group) : undefined
  const groups = getGroupIndex()
  const today = todayInBucharest()

  if (!settings || !group) {
    return (
      <main className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 pt-16 md:grid-cols-2">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight">Schedule</h1>
          <p className="mt-4 max-w-sm text-lg text-muted-foreground">
            Pick your year, specialization and group. It stays saved in this browser.
          </p>
          <Image
            src="/art/watch.png"
            alt="Pen sketch of a pocket watch, a fountain pen and a calendar"
            width={1008}
            height={616}
            className="graphite mt-8 w-80"
            priority
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your group</CardTitle>
            <CardDescription>You can change it later.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm groups={groups} />
          </CardContent>
        </Card>
      </main>
    )
  }

  const events = settings.semi
    ? group.events.filter((e) => !e.semi || e.semi === settings.semi)
    : group.events

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight">Schedule</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {group.level === "master" ? "Master's, year" : "Year"} {ROMAN[group.year]} · {group.specLabel} · Group{" "}
            {group.id}
            {settings.semi && <> · Subgroup {settings.semi}</>}
          </p>
        </div>
        <SettingsSheet groups={groups} initial={settings} />
      </div>

      <div className="mt-8">
        <WeekCalendar events={events} today={today} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Source:{" "}
        <a href={SCHEDULE_SOURCE} target="_blank" rel="noreferrer" className="underline underline-offset-4">
          official timetable
        </a>
        , updated {new Date(SCHEDULE_GENERATED).toLocaleDateString("en-GB")}.
      </p>
    </main>
  )
}
