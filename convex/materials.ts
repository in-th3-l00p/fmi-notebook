import { ConvexError, v } from "convex/values"

import { internalMutation, mutation, query } from "./_generated/server"
import { category } from "./schema"
import { contentTypeOf, extensionOf } from "./standard"

/** All files of a subject, optionally restricted to one category. Small enough to load whole. */
export const listBySubject = query({
  args: { subjectId: v.id("subjects"), category: v.optional(category) },
  handler: async (ctx, { subjectId, category }) => {
    return await ctx.db
      .query("materials")
      .withIndex("by_subject_category", (q) =>
        category ? q.eq("subjectId", subjectId).eq("category", category) : q.eq("subjectId", subjectId)
      )
      .collect()
  },
})

export const search = query({
  args: { text: v.string(), subjectId: v.optional(v.id("subjects")) },
  handler: async (ctx, { text, subjectId }) => {
    if (!text.trim()) return []
    const hits = await ctx.db
      .query("materials")
      .withSearchIndex("search_name", (q) =>
        subjectId ? q.search("name", text).eq("subjectId", subjectId) : q.search("name", text)
      )
      .take(30)
    const subjects = new Map<string, { slug: string; nameEn: string } | null>()
    return await Promise.all(
      hits.map(async (m) => {
        if (!subjects.has(m.subjectId)) {
          const s = await ctx.db.get(m.subjectId)
          subjects.set(m.subjectId, s && { slug: s.slug, nameEn: s.nameEn })
        }
        return { ...m, subject: subjects.get(m.subjectId) }
      })
    )
  },
})

export const fileUrl = query({
  args: { id: v.id("materials") },
  handler: async (ctx, { id }) => {
    const m = await ctx.db.get(id)
    return m ? await ctx.storage.getUrl(m.storageId) : null
  },
})

/**
 * Content-addressed lookup: if these exact bytes are already stored, the client
 * can skip the upload and reuse the blob.
 */
export const findBlob = query({
  args: { sha256: v.string() },
  handler: async (ctx, { sha256 }) => {
    const m = await ctx.db
      .query("materials")
      .withIndex("by_sha256", (q) => q.eq("sha256", sha256))
      .first()
    return m?.storageId ?? null
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
})

const FOLDER_RE = /^(?:[^/]+(?:\/[^/]+)*)?$/

/** Register a stored blob as a material, enforcing the standard. */
export const create = mutation({
  args: {
    subjectId: v.id("subjects"),
    category,
    folder: v.string(),
    name: v.string(),
    sha256: v.string(),
    storageId: v.id("_storage"),
    cohort: v.optional(v.string()),
    source: v.optional(
      v.object({ kind: v.literal("github"), repo: v.string(), path: v.string(), commit: v.string() })
    ),
    uploadedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId)
    if (!subject) throw new ConvexError("Unknown subject")
    const folder = args.folder.trim().replace(/\s*\/\s*/g, "/")
    if (!FOLDER_RE.test(folder)) throw new ConvexError("Folder must look like “Lab 1” or “Exams/2025”")
    const name = args.name.trim()
    if (!name || name.includes("/")) throw new ConvexError("Invalid file name")
    if (!/^[0-9a-f]{64}$/.test(args.sha256)) throw new ConvexError("Invalid sha256")

    const meta = await ctx.db.system.get(args.storageId)
    if (!meta) throw new ConvexError("Upload not found")

    // Same file already in the same place: nothing to do (makes imports re-runnable).
    const twins = await ctx.db
      .query("materials")
      .withIndex("by_subject_category", (q) =>
        q.eq("subjectId", args.subjectId).eq("category", args.category).eq("folder", folder)
      )
      .collect()
    const twin = twins.find((m) => m.name === name && m.sha256 === args.sha256)
    if (twin) return twin._id

    const id = await ctx.db.insert("materials", {
      ...args,
      folder,
      name,
      ext: extensionOf(name),
      size: meta.size,
      contentType: contentTypeOf(name),
    })
    await ctx.db.patch(subject._id, {
      fileCount: subject.fileCount + 1,
      totalBytes: subject.totalBytes + meta.size,
    })
    return id
  },
})

/**
 * Moderation: delete a material. Internal only (run from the dashboard or CLI) until
 * accounts and roles exist. Stored bytes are freed only when nothing else points at them.
 */
export const remove = internalMutation({
  args: { id: v.id("materials") },
  handler: async (ctx, { id }) => {
    const m = await ctx.db.get(id)
    if (!m) return
    await ctx.db.delete(id)
    const subject = await ctx.db.get(m.subjectId)
    if (subject)
      await ctx.db.patch(subject._id, {
        fileCount: subject.fileCount - 1,
        totalBytes: subject.totalBytes - m.size,
      })
    const stillUsed = await ctx.db
      .query("materials")
      .withIndex("by_sha256", (q) => q.eq("sha256", m.sha256))
      .first()
    if (!stillUsed) await ctx.storage.delete(m.storageId)
  },
})
