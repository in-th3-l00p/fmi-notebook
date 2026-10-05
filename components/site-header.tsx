import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label="FMI Notebook home" className="flex items-center gap-3">
          <Image
            src="/art/crest.png"
            alt=""
            width={735}
            height={957}
            className="graphite h-10 w-auto"
            priority
          />
          <span className="hidden font-serif text-2xl font-medium whitespace-nowrap sm:inline">FMI Notebook</span>
        </Link>
        <nav className="flex items-center sm:gap-1">
          <Button asChild variant="ghost" className="px-2 sm:px-2.5">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="ghost" className="px-2 sm:px-2.5">
            <Link href="/schedule">Schedule</Link>
          </Button>
          <Button asChild variant="ghost" className="px-2 sm:px-2.5">
            <Link href="/materials">Materials</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
