/**
 * The FMI materials standard.
 *
 * Every file lives at exactly one place:
 *
 *   program / subject / category / folder / file name
 *   e.g. info / programarea-algoritmilor / lab / "Laboratorul 01" / main.cpp
 *
 * - program   which degree the subject belongs to ("info" for now).
 * - subject   a canonical slug from SUBJECTS below; year and semester come from the
 *             subject's place in the current curriculum, so the same course taught
 *             in a different semester years ago still lands in one place.
 * - category  one of CATEGORIES, never free text.
 * - folder    optional free-form grouping inside a category ("Laboratorul 03",
 *             "Examen 2025 - Varianta I"). Use "/" for nesting, no leading/trailing "/".
 * - cohort    the generation the material comes from, e.g. "2024-2027".
 * - sha256    hex digest of the bytes; identical files are stored once and are the
 *             unit peers will exchange later.
 *
 * This file is shared by Convex functions, the importer and the UI, so it must stay
 * free of Node- or browser-only APIs.
 */

export const CATEGORIES = ["course", "seminar", "lab", "exam", "homework", "project", "resources"] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  course: "Lectures",
  seminar: "Seminars",
  lab: "Labs",
  exam: "Exams",
  homework: "Homework",
  project: "Projects",
  resources: "Resources",
}

export type SubjectDef = {
  slug: string
  /** Official (Romanian) name, as it appears on the timetable and diplomas. */
  name: string
  nameEn: string
  program: "info"
  year: 1 | 2 | 3
  semester: 1 | 2
  /** Other spellings people use: folder names, abbreviations. */
  aliases?: string[]
}

/** Computer Science (Informatică) bachelor's curriculum, 2024 onwards. */
export const SUBJECTS: SubjectDef[] = [
  // Year I, semester 1
  { slug: "arhitectura-sistemelor-de-calcul", name: "Arhitectura Sistemelor de Calcul", nameEn: "Computer Systems Architecture", program: "info", year: 1, semester: 1, aliases: ["ASC"] },
  { slug: "instrumente-si-tehnici-de-baza", name: "Instrumente și Tehnici de Bază în Informatică", nameEn: "Basic Tools and Techniques in Computer Science", program: "info", year: 1, semester: 1, aliases: ["ITBI"] },
  { slug: "programarea-algoritmilor", name: "Programarea Algoritmilor", nameEn: "Algorithm Programming", program: "info", year: 1, semester: 1, aliases: ["PA"] },
  { slug: "structuri-algebrice", name: "Structuri Algebrice în Informatică", nameEn: "Algebraic Structures in Computer Science", program: "info", year: 1, semester: 1, aliases: ["SAI"] },
  { slug: "tehnici-web", name: "Tehnici Web", nameEn: "Web Techniques", program: "info", year: 1, semester: 1, aliases: ["TW"] },
  { slug: "calcul-diferential-si-integral", name: "Calcul Diferențial și Integral", nameEn: "Differential and Integral Calculus", program: "info", year: 1, semester: 1, aliases: ["CDI"] },
  // Year I, semester 2
  { slug: "baze-de-date", name: "Baze de Date", nameEn: "Databases", program: "info", year: 1, semester: 2, aliases: ["BD"] },
  { slug: "geometrie-si-algebra-liniara", name: "Geometrie și Algebră Liniară", nameEn: "Geometry and Linear Algebra", program: "info", year: 1, semester: 2, aliases: ["GAL"] },
  { slug: "limbaje-formale-si-automate", name: "Limbaje Formale și Automate", nameEn: "Formal Languages and Automata", program: "info", year: 1, semester: 2, aliases: ["LFA"] },
  { slug: "logica-matematica", name: "Logică Matematică și Computațională", nameEn: "Mathematical and Computational Logic", program: "info", year: 1, semester: 2, aliases: ["LMC"] },
  { slug: "programare-orientata-pe-obiecte", name: "Programare Orientată pe Obiecte", nameEn: "Object-Oriented Programming", program: "info", year: 1, semester: 2, aliases: ["POO"] },
  { slug: "structuri-de-date", name: "Structuri de Date", nameEn: "Data Structures", program: "info", year: 1, semester: 2, aliases: ["SD"] },
  // Year II, semester 1
  { slug: "algoritmi-fundamentali", name: "Algoritmi Fundamentali", nameEn: "Fundamental Algorithms", program: "info", year: 2, semester: 1, aliases: ["AF"] },
  { slug: "sisteme-de-gestiune-a-bazelor-de-date", name: "Sisteme de Gestiune a Bazelor de Date", nameEn: "Database Management Systems", program: "info", year: 2, semester: 1, aliases: ["SGBD"] },
  { slug: "probabilitati-si-statistica", name: "Probabilități și Statistică", nameEn: "Probability and Statistics", program: "info", year: 2, semester: 1, aliases: ["PS"] },
  { slug: "programare-functionala", name: "Programare Funcțională", nameEn: "Functional Programming", program: "info", year: 2, semester: 1, aliases: ["PF"] },
  { slug: "sisteme-de-operare", name: "Sisteme de Operare", nameEn: "Operating Systems", program: "info", year: 2, semester: 1, aliases: ["SO"] },
  // Year II, semester 2
  { slug: "algoritmi-avansati", name: "Algoritmi Avansați", nameEn: "Advanced Algorithms", program: "info", year: 2, semester: 2, aliases: ["AA"] },
  { slug: "programare-avansata-pe-obiecte", name: "Programare Avansată pe Obiecte", nameEn: "Advanced Object-Oriented Programming", program: "info", year: 2, semester: 2, aliases: ["PAO"] },
  { slug: "inteligenta-artificiala", name: "Inteligență Artificială", nameEn: "Artificial Intelligence", program: "info", year: 2, semester: 2, aliases: ["IA"] },
  { slug: "fundamentele-limbajelor-de-programare", name: "Fundamentele Limbajelor de Programare", nameEn: "Foundations of Programming Languages", program: "info", year: 2, semester: 2, aliases: ["FLP"] },
  { slug: "retele-de-calculatoare", name: "Rețele de Calculatoare", nameEn: "Computer Networks", program: "info", year: 2, semester: 2, aliases: ["RC"] },
  { slug: "metode-de-dezvoltare-software", name: "Metode de Dezvoltare Software", nameEn: "Software Development Methods", program: "info", year: 2, semester: 2, aliases: ["MDS"] },
  // Year III, semester 1
  { slug: "securitatea-sistemelor-informatice", name: "Securitatea Sistemelor Informatice", nameEn: "Information Systems Security", program: "info", year: 3, semester: 1, aliases: ["SSI"] },
  { slug: "calculabilitate-si-complexitate", name: "Calculabilitate și Complexitate", nameEn: "Computability and Complexity", program: "info", year: 3, semester: 1, aliases: ["CC", "Calc&Complex"] },
  { slug: "inginerie-software", name: "Inginerie Software", nameEn: "Software Engineering", program: "info", year: 3, semester: 1, aliases: ["IS", "InginerieSoft"] },
  { slug: "grafica-pe-calculator", name: "Grafică pe Calculator", nameEn: "Computer Graphics", program: "info", year: 3, semester: 1, aliases: ["GC", "GraficaPeCalc"] },
  { slug: "robotic-process-automation", name: "Robotic Process Automation", nameEn: "Robotic Process Automation", program: "info", year: 3, semester: 1, aliases: ["RPA", "RPA UiPath"] },
  { slug: "introducere-in-jocuri-pe-calculator", name: "Introducere în Jocuri pe Calculator", nameEn: "Introduction to Computer Games", program: "info", year: 3, semester: 1, aliases: ["IntrProgrJocCalc"] },
  // Year III, semester 2
  { slug: "testarea-sistemelor-software", name: "Testarea Sistemelor Software", nameEn: "Software Systems Testing", program: "info", year: 3, semester: 2, aliases: ["TSS", "TestSistSoft"] },
  { slug: "metode-formale-in-inginerie-software", name: "Metode Formale în Inginerie Software", nameEn: "Formal Methods in Software Engineering", program: "info", year: 3, semester: 2, aliases: ["MFIS"] },
  { slug: "protocoale-criptografice", name: "Protocoale Criptografice", nameEn: "Cryptographic Protocols", program: "info", year: 3, semester: 2, aliases: ["PC"] },
]

/** Lower-case, strip diacritics and punctuation, for matching names and aliases. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const SUBJECT_INDEX = new Map<string, SubjectDef>()
for (const s of SUBJECTS) {
  for (const key of [s.slug, s.name, s.nameEn, ...(s.aliases ?? [])]) SUBJECT_INDEX.set(normalize(key), s)
}

export function findSubject(nameOrAlias: string): SubjectDef | undefined {
  return SUBJECT_INDEX.get(normalize(nameOrAlias))
}

/**
 * Folder names that only say "this is the X section" and carry no other information.
 * They are folded into the category and dropped from the folder path.
 */
const CATEGORY_CONTAINERS: Record<string, Category> = {
  curs: "course", cursuri: "course", course: "course", courses: "course", lectures: "course",
  seminar: "seminar", seminare: "seminar", seminarii: "seminar", seminars: "seminar",
  laborator: "lab", laboratoare: "lab", labs: "lab", lab: "lab",
  examen: "exam", examene: "exam", exams: "exam", exam: "exam", colocviu: "exam",
  teme: "homework", tema: "homework", homework: "homework",
  proiect: "project", proiecte: "project", project: "project", projects: "project",
  altele: "resources", bibliografie: "resources", resources: "resources",
}

/** Folder names that imply a category but are meaningful groupings worth keeping. */
const CATEGORY_HINTS: [RegExp, Category][] = [
  [/^(curs|course|demonstrat|materie|coduri curs)/, "course"],
  [/^(semin|tutoriat)/, "seminar"],
  [/^(lab|laborator|mips|src$)/, "lab"],
  [/(examen|exam|colocviu|partial|restanta|test|model|cheatsheet|sesiune)/, "exam"],
  [/^(tem[ae]|homework)/, "homework"],
  [/^(proiect|project)/, "project"],
  [/^(exercit|bibliograf|altele|resurse|tehnici de programare)/, "resources"],
]

function categoryFromFileName(file: string): Category | undefined {
  const n = normalize(file)
  if (/\b(curs|course|lecture|c\d)/.test(n)) return "course"
  if (/\b(seminar|sem\d)/.test(n)) return "seminar"
  if (/\b(lab|laborator)/.test(n)) return "lab"
  if (/\b(examen|exam|colocviu|partial|test)/.test(n)) return "exam"
  if (/\b(tema|homework)/.test(n)) return "homework"
  if (/\b(proiect|project)/.test(n)) return "project"
  return undefined
}

/**
 * Place a path found under a subject folder (e.g. "Laboratoare/Laborator 3/main.c")
 * into the standard: category + folder + file name.
 */
export function classifyPath(relativePath: string): { category: Category; folder: string; name: string } {
  const parts = relativePath.split("/").filter(Boolean)
  const name = parts.pop()!
  let category: Category | undefined
  const folder: string[] = []
  for (const part of parts) {
    const n = normalize(part)
    if (!category && CATEGORY_CONTAINERS[n]) {
      category = CATEGORY_CONTAINERS[n]
      continue
    }
    if (!category) category = CATEGORY_HINTS.find(([re]) => re.test(n))?.[1]
    folder.push(part.trim())
  }
  return {
    category: category ?? categoryFromFileName(name) ?? "resources",
    folder: folder.join("/"),
    name,
  }
}

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", txt: "text/plain", md: "text/markdown", csv: "text/csv",
  html: "text/html", css: "text/css", js: "text/javascript", json: "application/json", xml: "application/xml",
  zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ipynb: "application/x-ipynb+json",
}

/** Extensions shown as plain text in the previewer. */
export const TEXT_EXTENSIONS = new Set([
  "txt", "md", "c", "h", "cpp", "hpp", "cc", "py", "java", "js", "ts", "jsx", "tsx", "html", "css", "json",
  "xml", "sql", "hs", "pl", "s", "asm", "sh", "in", "out", "csv", "frag", "vert", "ejs", "yml", "yaml",
  "kt", "cs", "go", "rs", "rb", "php", "tex", "r", "m", "xaml", "ini", "cfg", "gitignore",
])

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".")
  return i > 0 ? name.slice(i + 1).toLowerCase() : ""
}

export function contentTypeOf(name: string): string {
  const ext = extensionOf(name)
  if (CONTENT_TYPES[ext]) return CONTENT_TYPES[ext]
  return TEXT_EXTENSIONS.has(ext) ? "text/plain" : "application/octet-stream"
}

/** Files that are noise, not study material. */
export function isJunk(path: string): boolean {
  return (
    /(^|\/)(\.idea|\.vscode|\.vs|\.settings|\.local|\.objects|__pycache__|node_modules|bin|obj|\.git)(\/|$)/i.test(path) ||
    /(^|\/)(\.ds_store|thumbs\.db|\.gitignore|desktop\.ini)$/i.test(path) ||
    /\.(dll|exe|pdb|obj|o|pyc|class|npy|suo|user|cache)$/i.test(path)
  )
}
