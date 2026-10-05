"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import { Folder, FolderOpen } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/convex/standard"

import { FilePreview } from "./file-preview"
import { ROMAN, fileIcon, formatBytes } from "./format"
import { UploadDialog } from "./upload-dialog"

const collator = new Intl.Collator("ro", { numeric: true, sensitivity: "base" })

export function SubjectBrowser({ slug }: { slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const subject = useQuery(api.subjects.bySlug, { slug })
  const all = useQuery(api.materials.listBySubject, subject ? { subjectId: subject._id } : "skip")

  const counts = useMemo(() => {
    const c = new Map<Category, number>()
    for (const m of all ?? []) c.set(m.category, (c.get(m.category) ?? 0) + 1)
    return c
  }, [all])

  const firstCategory = CATEGORIES.find((c) => counts.get(c)) ?? "course"
  const category = (params.get("c") as Category | null) ?? firstCategory
  const folder = params.get("f") ?? ""
  const openId = params.get("open")

  function go(next: { c?: Category; f?: string; open?: string | null }) {
    const q = new URLSearchParams()
    q.set("c", next.c ?? category)
    const f = next.f ?? folder
    if (f) q.set("f", f)
    const open = next.open === undefined ? null : next.open
    if (open) q.set("open", open)
    router.push(`${pathname}?${q}`, { scroll: false })
  }

  const { folders, files } = useMemo(() => {
    const inCategory = (all ?? []).filter((m) => m.category === category)
    const prefix = folder ? `${folder}/` : ""
    const folders = new Map<string, { count: number; bytes: number }>()
    const files: Doc<"materials">[] = []
    for (const m of inCategory) {
      if (m.folder === folder) files.push(m)
      else if (m.folder.startsWith(prefix)) {
        const child = m.folder.slice(prefix.length).split("/")[0]
        const agg = folders.get(child) ?? { count: 0, bytes: 0 }
        folders.set(child, { count: agg.count + 1, bytes: agg.bytes + m.size })
      }
    }
    return {
      folders: [...folders].sort(([a], [b]) => collator.compare(a, b)),
      files: files.sort((a, b) => collator.compare(a.name, b.name)),
    }
  }, [all, category, folder])

  const openFile = (openId && all?.find((m) => m._id === openId)) || null

  if (subject === null) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 pt-16">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Subject not found</EmptyTitle>
            <EmptyDescription>
              <Link href="/materials">Back to all materials</Link>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  const crumbs = folder ? folder.split("/") : []

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/materials">Materials</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{subject?.nameEn ?? "…"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            {subject?.nameEn ?? <Skeleton className="h-12 w-80" />}
          </h1>
          {subject && (
            <p className="mt-2 text-lg text-muted-foreground">
              {subject.name} · Year {ROMAN[subject.year]}, semester {ROMAN[subject.semester]} ·{" "}
              <span className="tabular">
                {subject.fileCount} files · {formatBytes(subject.totalBytes)}
              </span>
            </p>
          )}
        </div>
        {subject && <UploadDialog key={`${category}/${folder}`} subjectId={subject._id} category={category} folder={folder} />}
      </div>

      <Tabs value={category} onValueChange={(c) => go({ c: c as Category, f: "" })} className="mt-8">
        <div className="-mx-6 overflow-x-auto overflow-y-hidden px-6 pb-1">
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="px-3">
                {CATEGORY_LABEL[c]}
                <span className="ml-1.5 text-xs text-muted-foreground tabular">{counts.get(c) ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {crumbs.length > 0 && (
        <Breadcrumb className="mt-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button type="button" onClick={() => go({ f: "" })}>
                  {CATEGORY_LABEL[category]}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((part, i) => (
              <span key={i} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage>{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <button type="button" onClick={() => go({ f: crumbs.slice(0, i + 1).join("/") })}>
                        {part}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="mt-4 rounded-lg border">
        {all === undefined ? (
          <div className="grid gap-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>Empty</EmptyTitle>
              <EmptyDescription>No {CATEGORY_LABEL[category].toLowerCase()} for this subject yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead className="hidden w-28 text-right sm:table-cell">Size</TableHead>
                <TableHead className="hidden w-36 md:table-cell">From</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.map(([name, agg]) => (
                <TableRow
                  key={`d:${name}`}
                  className="cursor-pointer"
                  onClick={() => go({ f: folder ? `${folder}/${name}` : name })}
                >
                  <TableCell className="pl-4">
                    <span className="flex items-center gap-3 font-medium">
                      <Folder className="size-4 shrink-0 fill-primary/15 text-primary" />
                      {name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground tabular sm:table-cell">
                    {agg.count} {agg.count === 1 ? "file" : "files"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell" />
                </TableRow>
              ))}
              {files.map((m) => {
                const Icon = fileIcon(m.ext)
                return (
                  <TableRow key={m._id} className="cursor-pointer" onClick={() => go({ open: m._id })}>
                    <TableCell className="max-w-0 pl-4">
                      <span className="flex items-center gap-3">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{m.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground tabular sm:table-cell">
                      {formatBytes(m.size)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular md:table-cell">
                      {m.uploadedBy ?? (m.cohort ? `Class of ${m.cohort.slice(-4)}` : "")}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <FilePreview file={openFile} onClose={() => go({ open: null })} />
    </main>
  )
}
