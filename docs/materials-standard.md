# Materials standard

Every shared file has exactly one home:

```
program / subject / category / folder / file
info    / programarea-algoritmilor / lab / Laboratorul 01 / main.cpp
```

| Field | Rule |
|---|---|
| **subject** | A slug from the catalog in `convex/standard.ts` (`SUBJECTS`). Year and semester come from the current curriculum, so material from older generations still lands under the same subject. Folder names and abbreviations (e.g. `AA`, `PAO`, `Baze de date`) are resolved through `aliases`. |
| **category** | One of `course`, `seminar`, `lab`, `exam`, `homework`, `project`, `resources`. Never free text. Colloquia, partial exams and lab tests are `exam`. Tutoring sessions are `seminar`. Bibliography and miscellany are `resources`. |
| **folder** | Optional grouping inside the category, `/`-separated: `Laboratorul 03`, `Examen 2025/Model I`. Don't repeat the category ("Laboratoare/…"); the importer drops such container names automatically. |
| **file name** | Kept as the author named it. |
| **cohort** | The generation the file comes from, e.g. `2024-2027`. |
| **sha256** | Hex digest of the file's bytes. Identical bytes are stored once; uploading a file that already exists just links it. This content address is also what peers will exchange once sharing becomes peer-to-peer. |
| **source** | For imported files: repository, path and commit, so the original author stays credited. |

Noise is never stored: IDE folders (`.idea`, `.vscode`, `.settings`), build output (`bin`, `obj`, `__pycache__`), binaries (`.exe`, `.dll`, `.pyc`, `.npy`) and files over 95 MB. See `isJunk` in `convex/standard.ts`.

## Importing a repository

1. Shallow-clone the repository into a checkouts folder.
2. Add an entry to `SOURCES` in `scripts/import-materials.ts`. Give it a `locate` function that splits a path into the subject folder and the rest.
3. `npx tsx scripts/import-materials.ts <checkouts> --dry-run` to review the mapping and any unmatched subject folders. Add those to `aliases`.
4. Run it without `--dry-run`. Re-running is safe.

Imported so far:
- [TeodoraLazaroiu/FMI-Materials](https://github.com/TeodoraLazaroiu/FMI-Materials) (cohort 2020-2023, flat `Subject/Category`)
- [vlaxcs/FMI-INFO-S15-2024-2027](https://github.com/vlaxcs/FMI-INFO-S15-2024-2027) (cohort 2024-2027, `Anul/Semestrul/Subject/Category`)

Neither repository declares a license. Before the app is public, ask the authors for permission.
