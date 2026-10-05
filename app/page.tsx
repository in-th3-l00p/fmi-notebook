import Image from "next/image"
import Link from "next/link"
import { connection } from "next/server"
import { ArrowRight, CalendarDays, FolderOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SEMESTER_WEEKS, currentWeekIndex, todayInBucharest } from "@/lib/orar/semester"

const APPS = [
  {
    title: "Schedule",
    href: "/schedule",
    icon: CalendarDays,
    description: "Your group's classes for any week of the semester.",
  },
  {
    title: "Materials",
    href: "/materials",
    icon: FolderOpen,
    description: "Course notes, labs and old exams, sorted by subject.",
  },
]

export default async function Home() {
  await connection() // "this week" depends on today, so render per request
  const week = SEMESTER_WEEKS[currentWeekIndex(todayInBucharest())]

  return (
    <main className="mx-auto w-full max-w-6xl px-6">
      <section className="grid items-center gap-10 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
        <div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            University of Bucharest · Faculty of Mathematics and Computer Science
          </p>
          <h1 className="mt-5 font-serif text-6xl font-medium tracking-tight sm:text-7xl">FMI Notebook</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Useful stuff for FMI students: your timetable and a shared library of course materials.
          </p>
          {week && (
            <Badge variant="secondary" className="mt-8 h-7 px-3 text-sm">
              {week.number ? `Week ${week.number} (${week.parity})` : week.label}
            </Badge>
          )}
        </div>

        <Image
          src="/art/facade.png"
          alt="Pen sketch of a university building"
          width={959}
          height={593}
          priority
          className="graphite w-full"
        />
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-4 font-serif text-3xl font-medium">Apps</h2>
        <Card className="py-0">
          <CardContent className="px-0">
            {APPS.map((app) => (
              <Link
                key={app.href}
                href={app.href}
                className="group flex items-center gap-5 border-b px-6 py-5 transition-colors last:border-b-0 hover:bg-accent"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-md border bg-muted">
                  <app.icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-semibold">{app.title}</span>
                  <span className="block text-muted-foreground">{app.description}</span>
                </span>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
