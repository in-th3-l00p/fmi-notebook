import {
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  type LucideIcon,
} from "lucide-react"

import { TEXT_EXTENSIONS } from "@/convex/standard"

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ["KB", "MB", "GB"]
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`
}

export type PreviewKind = "pdf" | "image" | "text" | "none"

export function previewKind(ext: string): PreviewKind {
  if (ext === "pdf") return "pdf"
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "jfif"].includes(ext)) return "image"
  if (TEXT_EXTENSIONS.has(ext)) return "text"
  return "none"
}

export function fileIcon(ext: string): LucideIcon {
  if (["pdf", "doc", "docx", "txt", "md", "tex"].includes(ext)) return FileText
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "jfif"].includes(ext)) return FileImage
  if (["ppt", "pptx", "key"].includes(ext)) return Presentation
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive
  if (TEXT_EXTENSIONS.has(ext)) return FileCode
  return File
}

export const ROMAN = ["", "I", "II", "III", "IV"]

export async function sha256Hex(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}
