"use client"

import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { Download, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"

import { formatBytes, previewKind } from "./format"

const TEXT_LIMIT = 300_000

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    fetch(url)
      .then((r) => r.text())
      .then((t) => live && setText(t.length > TEXT_LIMIT ? `${t.slice(0, TEXT_LIMIT)}\n\n… (truncated)` : t))
      .catch(() => live && setText("Could not load this file."))
    return () => {
      live = false
    }
  }, [url])
  if (text === null) return <Skeleton className="h-full w-full" />
  return (
    <ScrollArea className="h-full rounded-md border bg-muted/40">
      <pre className="p-4 font-mono text-sm leading-relaxed whitespace-pre">{text}</pre>
    </ScrollArea>
  )
}

export function FilePreview({ file, onClose }: { file: Doc<"materials"> | null; onClose: () => void }) {
  const url = useQuery(api.materials.fileUrl, file ? { id: file._id } : "skip")
  const kind = file ? previewKind(file.ext) : "none"

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[88vh] flex-col gap-4 sm:max-w-5xl">
        {file && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="truncate font-sans text-base font-semibold">{file.name}</DialogTitle>
              <DialogDescription className="tabular">
                {formatBytes(file.size)}
                {file.cohort && ` · class of ${file.cohort}`}
                {file.uploadedBy && ` · shared by ${file.uploadedBy}`}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1">
              {!url ? (
                <Skeleton className="h-full w-full" />
              ) : kind === "pdf" ? (
                <iframe src={url} title={file.name} className="h-full w-full rounded-md border" />
              ) : kind === "image" ? (
                <div className="grid h-full place-items-center overflow-auto rounded-md border bg-muted/40 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user files from Convex storage */}
                  <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
                </div>
              ) : kind === "text" ? (
                <TextPreview url={url} />
              ) : (
                <div className="grid h-full place-items-center rounded-md border bg-muted/40 text-center text-muted-foreground">
                  <p>
                    Can&apos;t preview .{file.ext || "?"} files here. Download it instead.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {file.source && (
                <Button asChild variant="outline">
                  <a
                    href={`https://github.com/${file.source.repo}/blob/${file.source.commit}/${file.source.path
                      .split("/")
                      .map(encodeURIComponent)
                      .join("/")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink data-icon="inline-start" />
                    Source: {file.source.repo}
                  </a>
                </Button>
              )}
              {url && (
                <Button asChild>
                  <a href={url} download={file.name} target="_blank" rel="noreferrer">
                    <Download data-icon="inline-start" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
