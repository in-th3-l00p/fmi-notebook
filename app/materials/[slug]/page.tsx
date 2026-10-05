import { Suspense } from "react"
import type { Metadata } from "next"
import { fetchQuery } from "convex/nextjs"

import { SubjectBrowser } from "@/components/materials/subject-browser"
import { api } from "@/convex/_generated/api"

export async function generateMetadata({ params }: PageProps<"/materials/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const subject = await fetchQuery(api.subjects.bySlug, { slug })
  return {
    title: subject ? `${subject.nameEn} · Materials` : "Materials",
    description: subject ? `Lectures, labs and exams for ${subject.nameEn} (${subject.name}).` : undefined,
  }
}

export default async function SubjectPage({ params }: PageProps<"/materials/[slug]">) {
  const { slug } = await params
  return (
    <Suspense>
      <SubjectBrowser slug={slug} />
    </Suspense>
  )
}
