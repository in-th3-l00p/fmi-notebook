"use client"

import { useState } from "react"
import { Settings2 } from "lucide-react"

import { SettingsForm } from "@/components/orar/settings-form"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { GroupMeta } from "@/lib/orar/data"

export function SettingsSheet({
  groups,
  initial,
}: {
  groups: GroupMeta[]
  initial: React.ComponentProps<typeof SettingsForm>["initial"]
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings2 data-icon="inline-start" />
          Change group
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">Your group</SheetTitle>
          <SheetDescription>
            Stays saved in this browser.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <SettingsForm groups={groups} initial={initial} onSaved={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
