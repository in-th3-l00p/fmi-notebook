"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { Folder, Search } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"
import { CATEGORY_LABEL } from "@/convex/standard"

import { ROMAN, fileIcon, formatBytes } from "./format"
import { UploadDialog } from "./upload-dialog"

export function MaterialsHome() {
  const subjects = useQuery(api.subjects.list)
  const [text, setText] = useState("")
  const results = useQuery(api.materials.search, text.trim().length > 1 ? { text } : "skip")

  const totalFiles = subjects?.reduce((n, s) => n + s.fileCount, 0) ?? 0
  const totalBytes = subjects?.reduce((n, s) => n + s.totalBytes, 0) ?? 0

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight">Materials</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Notes, labs and old exams from students in previous years.
            {subjects && (
              <span className="tabular">
                {" "}
                {totalFiles.toLocaleString("en-GB")} files · {formatBytes(totalBytes)}
              </span>
            )}
          </p>
        </div>
        <UploadDialog />
      </div>

      <div className="relative mt-8">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search files by name…"
          className="h-11 pl-9 text-base"
        />
      </div>

      {text.trim().length > 1 ? (
        <Card className="mt-4 py-2">
          <CardContent className="px-2">
            {results === undefined ? (
              <Skeleton className="m-2 h-24" />
            ) : results.length === 0 ? (
              <p className="p-4 text-muted-foreground">No files match “{text}”.</p>
            ) : (
              results.map((m) => {
                const Icon = fileIcon(m.ext)
                const href = `/materials/${m.subject?.slug}?c=${m.category}${m.folder ? `&f=${encodeURIComponent(m.folder)}` : ""}&open=${m._id}`
                return (
                  <Link key={m._id} href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                    <span className="hidden truncate text-sm text-muted-foreground sm:block">
                      {m.subject?.nameEn} · {CATEGORY_LABEL[m.category]}
                      {m.folder && ` · ${m.folder}`}
                    </span>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="1" className="mt-8">
          <TabsList>
            {[1, 2, 3].map((y) => (
              <TabsTrigger key={y} value={String(y)} className="px-4">
                Year {ROMAN[y]}
              </TabsTrigger>
            ))}
          </TabsList>
          {[1, 2, 3].map((y) => (
            <TabsContent key={y} value={String(y)} className="mt-4 grid gap-8">
              {[1, 2].map((sem) => (
                <section key={sem}>
                  <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Semester {ROMAN[sem]}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects === undefined
                      ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
                      : subjects
                          .filter((s) => s.year === y && s.semester === sem)
                          .map((s) => (
                            <Link key={s._id} href={`/materials/${s.slug}`} className="group">
                              <Card className="h-full transition-colors group-hover:bg-accent">
                                <CardContent className="flex gap-3">
                                  <Folder className="mt-0.5 size-5 shrink-0 text-primary" />
                                  <div className="min-w-0">
                                    <div className="font-semibold">{s.nameEn}</div>
                                    <div className="truncate text-sm text-muted-foreground">{s.name}</div>
                                    <div className="mt-2 text-sm text-muted-foreground tabular">
                                      {s.fileCount} files · {formatBytes(s.totalBytes)}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                  </div>
                </section>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </main>
  )
}
