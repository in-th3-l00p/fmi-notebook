import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { SUBJECTS } from "./standard"

/** Every subject, ordered by year and semester, with file counts. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subjects")
      .withIndex("by_program_year", (q) => q.eq("program", "info"))
      .collect()
  },
})

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique()
  },
})

/** Create or update the subject catalog from the standard. Safe to run repeatedly. */
export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    for (const s of SUBJECTS) {
      const existing = await ctx.db
        .query("subjects")
        .withIndex("by_slug", (q) => q.eq("slug", s.slug))
        .unique()
      const fields = {
        slug: s.slug,
        name: s.name,
        nameEn: s.nameEn,
        program: s.program,
        year: s.year,
        semester: s.semester,
        aliases: s.aliases ?? [],
      }
      if (existing) await ctx.db.patch(existing._id, fields)
      else await ctx.db.insert("subjects", { ...fields, fileCount: 0, totalBytes: 0 })
    }
    return SUBJECTS.length
  },
})
