import type { Metadata } from "next"

import { MaterialsHome } from "@/components/materials/materials-home"

export const metadata: Metadata = {
  title: "Materials",
  description: "Course notes, labs and old exams from FMI students.",
}

export default function MaterialsPage() {
  return <MaterialsHome />
}
