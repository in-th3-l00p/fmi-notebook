"use client"

import { useState } from "react"
import { useConvex, useMutation, useQuery } from "convex/react"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { CATEGORIES, CATEGORY_LABEL, contentTypeOf, type Category } from "@/convex/standard"

import { ROMAN, sha256Hex } from "./format"

const MAX_BYTES = 95 * 1024 * 1024

export function UploadDialog({
  subjectId,
  category,
  folder,
}: {
  subjectId?: Id<"subjects">
  category?: Category
  folder?: string
}) {
  const subjects = useQuery(api.subjects.list)
  const convex = useConvex()
  const generateUploadUrl = useMutation(api.materials.generateUploadUrl)
  const create = useMutation(api.materials.create)

  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState<string>(subjectId ?? "")
  const [cat, setCat] = useState<Category>(category ?? "course")
  const [dir, setDir] = useState(folder ?? "")
  const [name, setName] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<number | null>(null)

  function reset(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setSubject(subjectId ?? "")
      setCat(category ?? "course")
      setDir(folder ?? "")
      setFiles([])
      setProgress(null)
    }
  }

  async function upload() {
    const tooBig = files.find((f) => f.size > MAX_BYTES)
    if (tooBig) return toast.error(`${tooBig.name} is larger than 95 MB`)
    setProgress(0)
    let reused = 0
    try {
      for (const [i, file] of files.entries()) {
        const sha256 = await sha256Hex(file)
        let storageId = await convex.query(api.materials.findBlob, { sha256 })
        if (storageId) reused++
        else {
          const res = await fetch(await generateUploadUrl(), {
            method: "POST",
            headers: { "Content-Type": file.type || contentTypeOf(file.name) },
            body: file,
          })
          if (!res.ok) throw new Error(`Upload of ${file.name} failed`)
          storageId = (await res.json()).storageId as Id<"_storage">
        }
        await create({
          subjectId: subject as Id<"subjects">,
          category: cat,
          folder: dir,
          name: file.name,
          sha256,
          storageId,
          uploadedBy: name.trim() || undefined,
        })
        setProgress(((i + 1) / files.length) * 100)
      }
      toast.success(`${files.length} ${files.length === 1 ? "file" : "files"} added`, {
        description: reused ? `${reused} ${reused === 1 ? "was" : "were"} already here, so ${reused === 1 ? "it wasn't" : "they weren't"} uploaded again.` : undefined,
      })
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
      setProgress(null)
    }
  }

  const busy = progress !== null

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && reset(o)}>
      <DialogTrigger asChild>
        <Button>
          <Upload data-icon="inline-start" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload materials</DialogTitle>
          <DialogDescription>
            Pick where the files go so other people can find them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="up-subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject} disabled={busy}>
              <SelectTrigger id="up-subject" className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((y) => (
                  <SelectGroup key={y}>
                    <SelectLabel>Year {ROMAN[y]}</SelectLabel>
                    {subjects
                      ?.filter((s) => s.year === y)
                      .map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.nameEn}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="up-category">Category</Label>
              <Select value={cat} onValueChange={(v) => setCat(v as Category)} disabled={busy}>
                <SelectTrigger id="up-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="up-folder">Folder (optional)</Label>
              <Input
                id="up-folder"
                placeholder="e.g. Lab 3"
                value={dir}
                onChange={(e) => setDir(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="up-name">Your name (optional)</Label>
            <Input id="up-name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="up-files">Files</Label>
            <Input
              id="up-files"
              type="file"
              multiple
              onChange={(e) => setFiles([...(e.target.files ?? [])])}
              disabled={busy}
            />
          </div>

          {busy && <Progress value={progress} />}
        </div>

        <DialogFooter>
          <Button onClick={upload} disabled={!subject || files.length === 0 || busy}>
            {busy ? "Uploading…" : `Upload ${files.length || ""} ${files.length === 1 ? "file" : "files"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
