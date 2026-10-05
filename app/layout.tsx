import type { Metadata } from "next"
import { EB_Garamond, Inter } from "next/font/google"

import { ConvexClientProvider } from "@/components/convex-provider"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin", "latin-ext"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
})

export const metadata: Metadata = {
  title: {
    default: "FMI Notebook",
    template: "%s · FMI Notebook",
  },
  description:
    "Timetable and course materials for students at the Faculty of Mathematics and Computer Science, University of Bucharest.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${garamond.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ConvexClientProvider>
          <TooltipProvider>
            <SiteHeader />
            <div className="flex flex-1 flex-col pb-20">{children}</div>
          </TooltipProvider>
        </ConvexClientProvider>
        <Toaster position="bottom-center" theme="light" />
      </body>
    </html>
  )
}
