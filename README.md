# FMI Notebook

Small web app for students at the Faculty of Mathematics and Computer Science, University of Bucharest.

- **Schedule**: your group's timetable for any week of the semester, with odd and even weeks handled.
- **Materials**: course notes, labs and old exams sorted by subject. Anyone can upload.

Built with Next.js, shadcn/ui and Convex.

## Running it locally

```bash
npm install
npx convex dev          # starts the backend and writes .env.local
npm run dev
```

To fill the materials library, clone the source repos into one folder and run:

```bash
npx tsx scripts/import-materials.ts <folder> --dry-run   # check the mapping first
npx tsx scripts/import-materials.ts <folder>
```

How files are organised is described in [docs/materials-standard.md](docs/materials-standard.md).

## Updating the timetable

The timetable comes from the faculty's PDF. `scripts/parse-orar.py` turns it into `lib/orar/orar.json`. See the comment at the top of that script.
