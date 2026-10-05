/**
 * Import community material repositories into Convex, following convex/standard.ts.
 *
 *   npx tsx scripts/import-materials.ts <checkouts-dir> [--dry-run]
 *
 * <checkouts-dir> must contain shallow clones named as in SOURCES below.
 * Re-running is safe: identical files are skipped, and stored bytes are reused by hash.
 */
import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { ConvexHttpClient } from "convex/browser"

import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { classifyPath, contentTypeOf, findSubject, isJunk, type Category } from "../convex/standard"

type Source = {
  dir: string
  repo: string
  cohort: string
  /** Split a repo-relative path into the subject folder name and the rest. */
  locate: (parts: string[]) => { subject: string; rest: string[] } | null
}

const SOURCES: Source[] = [
  {
    // Flat: <Subject>/<Category>/...
    dir: "teo",
    repo: "TeodoraLazaroiu/FMI-Materials",
    cohort: "2020-2023",
    locate: (p) => (p.length >= 2 ? { subject: p[0], rest: p.slice(1) } : null),
  },
  {
    // Nested: Anul I - Licenta/Semestrul I/<Subject>/<Category>/...
    dir: "vlax",
    repo: "vlaxcs/FMI-INFO-S15-2024-2027",
    cohort: "2024-2027",
    locate: (p) => (p.length >= 4 && /^Anul/.test(p[0]) ? { subject: p[2], rest: p.slice(3) } : null),
  },
]

const MAX_BYTES = 95 * 1024 * 1024

type Planned = {
  abs: string
  source: Source
  commit: string
  path: string
  subjectSlug: string
  category: Category
  folder: string
  name: string
  size: number
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === ".git") return []
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

function plan(root: string) {
  const planned: Planned[] = []
  const unmatched = new Map<string, number>()
  const skipped = { junk: 0, tooBig: 0, outside: 0 }
  for (const source of SOURCES) {
    const base = join(root, source.dir)
    const commit = execSync("git rev-parse HEAD", { cwd: base }).toString().trim()
    for (const abs of walk(base)) {
      const path = relative(base, abs).split(sep).join("/")
      if (isJunk(path)) { skipped.junk++; continue }
      const loc = source.locate(path.split("/"))
      if (!loc) { skipped.outside++; continue }
      const subject = findSubject(loc.subject)
      if (!subject) { unmatched.set(`${source.dir}: ${loc.subject}`, (unmatched.get(`${source.dir}: ${loc.subject}`) ?? 0) + 1); continue }
      const size = statSync(abs).size
      if (size > MAX_BYTES) { skipped.tooBig++; continue }
      planned.push({ abs, source, commit, path, subjectSlug: subject.slug, ...classifyPath(loc.rest.join("/")), size })
    }
  }
  return { planned, unmatched, skipped }
}

async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++
        await fn(items[i], i)
      }
    })
  )
}

async function main() {
  const [root, flag] = process.argv.slice(2)
  if (!root) throw new Error("usage: import-materials.ts <checkouts-dir> [--dry-run]")
  const { planned, unmatched, skipped } = plan(root)

  const byCategory = new Map<string, number>()
  for (const p of planned) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1)
  const mb = (n: number) => `${(n / 2 ** 20).toFixed(0)} MB`
  console.log(`planned ${planned.length} files, ${mb(planned.reduce((s, p) => s + p.size, 0))}`)
  console.log("by category:", Object.fromEntries(byCategory))
  console.log("skipped:", skipped)
  if (unmatched.size) console.log("unmatched subject folders:", Object.fromEntries(unmatched))

  if (flag === "--dry-run") {
    for (const p of planned.filter((_, i) => i % 40 === 0))
      console.log(`  ${p.source.dir}:${p.path}\n    → ${p.subjectSlug} / ${p.category} / ${p.folder || "·"} / ${p.name}`)
    return
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set (see .env.local)")
  const client = new ConvexHttpClient(url)
  await client.mutation(api.subjects.sync, {})
  const subjects = new Map((await client.query(api.subjects.list, {})).map((s) => [s.slug, s._id]))

  let done = 0, uploaded = 0, reused = 0
  await pool(planned, 6, async (p) => {
    const bytes = readFileSync(p.abs)
    const sha256 = createHash("sha256").update(bytes).digest("hex")
    let storageId = (await client.query(api.materials.findBlob, { sha256 })) as Id<"_storage"> | null
    if (storageId) reused++
    else {
      const uploadUrl = await client.mutation(api.materials.generateUploadUrl, {})
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": contentTypeOf(p.name) }, body: bytes })
      if (!res.ok) throw new Error(`upload failed for ${p.path}: ${res.status}`)
      storageId = (await res.json()).storageId
      uploaded++
    }
    await client.mutation(api.materials.create, {
      subjectId: subjects.get(p.subjectSlug)!,
      category: p.category,
      folder: p.folder,
      name: p.name,
      sha256,
      storageId: storageId!,
      cohort: p.source.cohort,
      source: { kind: "github", repo: p.source.repo, path: p.path, commit: p.commit },
    })
    if (++done % 100 === 0) console.log(`  ${done}/${planned.length}`)
  })
  console.log(`done: ${done} files (${uploaded} uploaded, ${reused} deduplicated by hash)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
