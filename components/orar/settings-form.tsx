"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { saveSettings } from "@/app/schedule/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { ElectivePick, GroupMeta } from "@/lib/orar/data"

type Initial = { year: string; spec: string; group: string; semi: string; electives: ElectivePick[] }

const ROMAN = ["", "I", "II", "III", "IV"]
const WHOLE_GROUP = "all"
const ALL_LABS = "all"

function yearKey(g: GroupMeta) {
  return `${g.level}-${g.year}`
}

function yearLabel(key: string) {
  const [level, n] = key.split("-")
  return level === "master" ? `Master's, year ${ROMAN[+n]}` : `Year ${ROMAN[+n]}`
}

export function SettingsForm({
  groups,
  initial,
  onSaved,
}: {
  groups: GroupMeta[]
  initial?: Initial | null
  onSaved?: () => void
}) {
  const [year, setYear] = useState(initial?.year ?? "")
  const [spec, setSpec] = useState(initial?.spec ?? "")
  const [group, setGroup] = useState(initial?.group ?? "")
  const [semi, setSemi] = useState(initial?.semi || WHOLE_GROUP)
  // subject -> chosen lab group ("" = not chosen / no labs)
  const [picks, setPicks] = useState(() => new Map((initial?.electives ?? []).map((p) => [p.subject, p.lab])))
  const [pending, startTransition] = useTransition()

  const years = useMemo(() => [...new Set(groups.map(yearKey))], [groups])
  const specs = useMemo(() => {
    const seen = new Map<string, string>()
    for (const g of groups) if (yearKey(g) === year) seen.set(g.spec, g.specLabel)
    return [...seen]
  }, [groups, year])
  const groupOptions = groups.filter((g) => yearKey(g) === year && g.spec === spec)
  const semis = groups.find((g) => g.id === group)?.semis ?? []
  const electives = groups.find((g) => g.id === group)?.electives ?? []

  function togglePick(subject: string, on: boolean) {
    setPicks((prev) => {
      const next = new Map(prev)
      if (on) next.set(subject, "")
      else next.delete(subject)
      return next
    })
  }

  function setLab(subject: string, lab: string) {
    setPicks((prev) => new Map(prev).set(subject, lab === ALL_LABS ? "" : lab))
  }

  function pickYear(value: string) {
    setYear(value)
    setSpec("")
    setGroup("")
    setSemi(WHOLE_GROUP)
  }

  function pickSpec(value: string) {
    setSpec(value)
    const only = groups.filter((g) => yearKey(g) === year && g.spec === value)
    setGroup(only.length === 1 ? only[0].id : "")
    setSemi(WHOLE_GROUP)
  }

  function submit() {
    startTransition(async () => {
      const res = await saveSettings({
        year,
        spec,
        group,
        semi: semi === WHOLE_GROUP ? "" : semi,
        electives: electives.filter((o) => picks.has(o.subject)).map((o) => ({ subject: o.subject, lab: picks.get(o.subject)! })),
      })
      if (res.ok) {
        toast.success(`Saved. Group ${group} will open by default.`)
        onSaved?.()
      } else {
        toast.error("That group isn't in the timetable.")
      }
    })
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Field label="Year" htmlFor="year">
        <Select value={year} onValueChange={pickYear}>
          <SelectTrigger id="year" className="w-full">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Bachelor&apos;s</SelectLabel>
              {years.filter((y) => y.startsWith("licenta")).map((y) => (
                <SelectItem key={y} value={y}>{yearLabel(y)}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Master&apos;s</SelectLabel>
              {years.filter((y) => y.startsWith("master")).map((y) => (
                <SelectItem key={y} value={y}>{yearLabel(y)}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Specialization" htmlFor="spec">
        <Select value={spec} onValueChange={pickSpec} disabled={!year}>
          <SelectTrigger id="spec" className="w-full">
            <SelectValue placeholder="Select specialization" />
          </SelectTrigger>
          <SelectContent>
            {specs.map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Group" htmlFor="group">
          <Select
            value={group}
            onValueChange={(v) => {
              setGroup(v)
              setSemi(WHOLE_GROUP)
            }}
            disabled={!spec}
          >
            <SelectTrigger id="group" className="w-full tabular">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((g) => (
                <SelectItem key={g.id} value={g.id} className="tabular">{g.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Subgroup" htmlFor="semi">
          <Select value={semi} onValueChange={setSemi} disabled={!group || semis.length === 0}>
            <SelectTrigger id="semi" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WHOLE_GROUP}>Whole group</SelectItem>
              {semis.map((s) => (
                <SelectItem key={s} value={s}>Subgroup {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {electives.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Optional courses</legend>
          <p className="-mt-1 mb-1 text-sm text-muted-foreground">Tick the ones you take. They show up in your timetable.</p>
          <div className="grid gap-1 rounded-lg border p-2">
            {electives.map((o) => {
              const id = `opt-${o.subject}`
              const checked = picks.has(o.subject)
              return (
                <div key={o.subject} className="flex min-h-9 items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/60">
                  <Checkbox id={id} checked={checked} onCheckedChange={(v) => togglePick(o.subject, v === true)} />
                  <Label htmlFor={id} className="flex-1 cursor-pointer font-normal">
                    {o.subject}
                    {o.kind === "facultative" && <span className="ml-1.5 text-xs text-muted-foreground">facultative</span>}
                  </Label>
                  {checked && o.labGroups.length > 0 && (
                    <Select value={picks.get(o.subject) || ALL_LABS} onValueChange={(v) => setLab(o.subject, v)}>
                      <SelectTrigger size="sm" className="w-32" aria-label={`Lab group for ${o.subject}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_LABS}>All labs</SelectItem>
                        {o.labGroups.map((g) => (
                          <SelectItem key={g} value={g}>
                            Lab group {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>
      )}

      <Button type="submit" size="lg" disabled={!group || pending} className="mt-2 h-10">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  )
}
