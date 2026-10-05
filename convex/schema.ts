import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import { CATEGORIES } from "./standard"

export const category = v.union(...CATEGORIES.map((c) => v.literal(c)))

export default defineSchema({
  subjects: defineTable({
    slug: v.string(),
    name: v.string(),
    nameEn: v.string(),
    program: v.literal("info"),
    year: v.number(),
    semester: v.number(),
    aliases: v.array(v.string()),
    /** Denormalized so the overview never has to scan materials. */
    fileCount: v.number(),
    totalBytes: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_program_year", ["program", "year", "semester"]),

  materials: defineTable({
    subjectId: v.id("subjects"),
    category,
    /** Grouping inside the category, "/"-separated; "" for the category root. */
    folder: v.string(),
    name: v.string(),
    ext: v.string(),
    size: v.number(),
    contentType: v.string(),
    sha256: v.string(),
    storageId: v.id("_storage"),
    /** Generation the material comes from, e.g. "2024-2027". */
    cohort: v.optional(v.string()),
    /** Where the file was imported from; absent for direct uploads. */
    source: v.optional(
      v.object({
        kind: v.literal("github"),
        repo: v.string(),
        path: v.string(),
        commit: v.string(),
      })
    ),
    /** Free-text uploader name until accounts exist. */
    uploadedBy: v.optional(v.string()),
  })
    .index("by_subject_category", ["subjectId", "category", "folder"])
    .index("by_sha256", ["sha256"])
    .searchIndex("search_name", { searchField: "name", filterFields: ["subjectId"] }),
})
