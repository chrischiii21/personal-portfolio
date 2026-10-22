# Portfolio notes

- The résumé PDF (`public/Christy-Montejo-Resume.pdf`) is generated from the data exports in `src/components/HomePage.tsx` via `src/pages/resume.astro`. Never edit the PDF by hand; change the data and run `npm run resume` (needs Chrome). The `sync-resume` workflow also regenerates it on every push that touches that data.
