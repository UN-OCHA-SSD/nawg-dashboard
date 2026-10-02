# NAWG dashboard · South Sudan

Interactive monthly dashboard for GitHub Pages.

- Public site: https://un-ocha-ssd.github.io/nawg-dashboard/
- Repository: https://github.com/UN-OCHA-SSD/nawg-dashboard

## Monthly source: ActivityInfo

All monthly maps, indicators, county profiles, trends, persistence, transitions and data downloads use the same ActivityInfo form, `cdqmo0mmmapb33se`. There is no archive source selector, manual monthly CSV importer or fallback observation dataset. Old links with `source=archive` resolve to ActivityInfo without losing the county, page or reporting month.

The 10 September 2026 refresh contains 2,834 dated county/month records across 36 reporting months, January 2023–June 2026. June 2026 covers all 79 counties and is the default period. Another 78 rows have both Year and Month marked “Not classified”; these remain in ActivityInfo but are excluded, with counts in Methods & sources.

Source labels are preserved. Earlier A/B1/B2/C/D/E bands are not recoded to the revised A–F scheme. Colours, high-severity membership and band-history labels respect the applicable framework. Direct score comparisons and dotted trend connectors cannot cross December 2025.

## Retained references

`data/nawg-reference.json` holds only supplied methodology definitions (band meanings and indicator weights) and the PDF manifest. It contains no observations. The manual monthly archive and annual HNRP values remain removed. Operational dashboard figures and county exports derive exclusively from ActivityInfo.

On 1 October 2026 the user approved a separate reference comparison: `data/framework-comparison-reference.json` contains only the six national January–June 2026 sensitivity results supplied with the colleague's study. The published 2025/2026 lines are calculated from ActivityInfo. Reference bounds are shown only for all 79 counties, complete resolved coverage in both years, and published means matching the study's inputs within floating-point tolerance. Missing, conflicting, changed or filtered inputs withhold the reference range; no reference value fills an ActivityInfo observation. The adjustment workbook is unavailable, so the bounds are not independently reproduced, interpolated or extended. They represent displacement-flow methodological sensitivity, not a confidence interval. A new validated study or calculation workbook is required to extend the comparison.

The revised climate maximum is 1.0; revised UVS and ATS maxima total 2 and 8. Source climate values and final NSS are unchanged. Methodology renders a native clickable flowchart matching the supplied framework image, with discussion branches, contextual analysis, final classification, zoom/fit controls and internal panning on narrow screens. National charts default to an explicitly truncated 5–7.5 axis with automatic expansion for out-of-range filtered values and a full 0–10 option.

`data/framework-documentation.json` contains source-backed explanations for all 29 diagram elements and four expandable review/follow-up notes. Page-specific citations and the full-document/download links reuse the existing 13-page framework PDF, which is byte-identical to the user's supplied `NAWG_Framework.pdf` (SHA-256 `9e864a25ab64436759b397f627da579a5c1557b23825f24f67b876f271858bb3`). The page-9 malnutrition table/prose discrepancy and page-7 threshold-boundary ambiguities are disclosed rather than silently resolved. These descriptions and base-score tables explain the method only; they do not change or recalculate ActivityInfo observations.

The 20 PDF products remain available as reference documents; their figures never fill operational observations. The comparison method description follows the companion trend report, while supplied endpoints are retained as reference outputs. ReliefWeb URLs remain placeholders until supplied. Official boundary files and logos remain. Original user CSVs outside this project have not been deleted. Retired tracked files remain recoverable from Git history; this release does not rewrite repository history.

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
