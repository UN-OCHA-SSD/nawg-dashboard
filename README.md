# NAWG dashboard · South Sudan

Interactive monthly dashboard for GitHub Pages.

- Public site: https://un-ocha-ssd.github.io/nawg-dashboard/
- Repository: https://github.com/UN-OCHA-SSD/nawg-dashboard

## Monthly source: ActivityInfo

All monthly maps, indicators, county profiles, trends, persistence, transitions and data downloads use the same ActivityInfo form, `cdqmo0mmmapb33se`. There is no archive source selector, manual monthly CSV importer or fallback observation dataset. Old links with `source=archive` resolve to ActivityInfo without losing the county, page or reporting month.

The 10 September 2026 refresh contains 2,834 dated county/month records across 36 reporting months, January 2023–June 2026. June 2026 covers all 79 counties and is the default period. Another 78 rows have both Year and Month marked “Not classified”; these remain in ActivityInfo but are excluded, with counts in Methods & sources.

Source labels are preserved. Earlier A/B1/B2/C/D/E bands are not recoded to the revised A–F scheme. Colours, high-severity membership and band-history labels respect the applicable framework. Direct score comparisons and dotted trend connectors cannot cross December 2025.

## Retained references

`data/nawg-reference.json` holds only supplied methodology definitions (band meanings and indicator weights) and the PDF manifest. It contains no observations. The manual archive, annual HNRP values and fixed historical framework sensitivity series have been removed from the current repository and published dashboard. All dashboard figures and data exports derive exclusively from ActivityInfo.

The 20 PDF products remain available as reference documents, never inputs to calculations; ReliefWeb URLs remain placeholders until supplied. Official boundary files and logos remain. Original user CSVs outside this project have not been deleted. Retired tracked files remain recoverable from Git history; this release does not rewrite repository history.

## Build, test and preview

Requires Node.js 24 and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm build:pages
pnpm test
pnpm test:pages
pnpm preview --mode pages --host 127.0.0.1 --port 4383 --strictPort
```

Open `/nawg-dashboard/`. Deploy **dist/pages/** only. Approved browser regressions: `pnpm test:ui`, `pnpm test:reset`, `node scripts/check-county-picker.mjs`, and `QA_URL=http://127.0.0.1:4383/nawg-dashboard node scripts/check-playback-stability.mjs`.

The interface retains its full-title header, REACH/OCHA logos, eight analytical destinations, top filters, right-aligned searchable county selector, reset controls, maps, playback, and light/dark themes.

## Monthly refresh

1. Correct and review records in ActivityInfo.
2. Keep `ACTIVITYINFO_TOKEN` only in ignored `.env.local` or the local environment. Never put it in a `VITE_` variable or GitHub.
3. Run `pnpm data:refresh`. This reads the form, validates required fields/dates/geography/scores, creates an allowlisted `data/nawg-public.json`, and updates the ignored private cache only after validation.
4. Review source exclusions, conflicts, coverage, final scores and historical changes in `data-quality.md`. Successful export is not approval of the underlying assessment.
5. Build and test. Preview locally. On the user's publish request, commit reviewed changes and push to main; the existing Pages workflow deploys the static release.

The dashboard is a monthly published snapshot, not a live public API connection. Public files exclude free-text notes, internal record IDs, source coordinates and credentials. A limited classification-context label is derived privately from notes/score differences; the note text never enters the public snapshot.

`pnpm data:export` can reproduce an export from the ignored cache. It does not contact ActivityInfo. Prefer a fresh pull for a release. Failed refreshes leave the last validated published snapshot intact.

## Local live mode and packaging

`pnpm dev --host 127.0.0.1 --port 4381 --strictPort` retains the read-only local API. The footer's “Refresh local ActivityInfo” action updates the local session; it does not publish to GitHub. Both local and public modes use the same allowlist and date treatment.

The inherited `pnpm build` / Worker packaging and protected hosting files remain intact, but GitHub Pages is the only requested public host. No scheduled updates or hosted API credentials are required.

Boundaries and designations do not imply UN endorsement or acceptance.
