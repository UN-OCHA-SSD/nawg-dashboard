# NAWG dashboard · South Sudan

Interactive county needs dashboard published on GitHub Pages.

- Dashboard: https://un-ocha-ssd.github.io/nawg-dashboard/
- Repository: https://github.com/UN-OCHA-SSD/nawg-dashboard

## Explore the evidence

The static site retains the interactive national/county maps, state and county search, indicator/band filters, monthly playback, county profiles, comparison periods, indicator cards, 12/24-month trends, dotted gap guides, light/dark modes and downloads. All exploration runs in the visitor's browser; no ActivityInfo token or server is required.

The current release contains January 2023–December 2025 observations. November 2025 is initially selected because it is the latest month meeting the 80% county-coverage rule. Later partial months remain selectable. Newly published months are discovered automatically; no 2026 observations are fabricated.

The public export includes county/state names, reporting periods, source scores, bands and indicator classifications. Internal record IDs, free-text notes, coordinates, credentials and the original meeting PowerPoint are excluded. Duplicate metric variants remain available for transparent review; conflicting county/month scores are withheld, not averaged. Dotted chart connectors are visual guides across missing data, not estimated observations.

## Monthly updates

The site does not query ActivityInfo. Its refresh control reloads the latest **published** snapshot only.

After the monthly records have been entered and reviewed in the same ActivityInfo form, the maintainer can update locally:

1. Configure `ACTIVITYINFO_TOKEN` in a local ignored `.env.local` file or the shell environment. Never prefix it with `VITE_`, commit it, or place it in a public file.
2. Run `pnpm data:refresh`. This retrieves the form privately, validates county/date mappings, removes fields outside the public allowlist and writes `data/nawg-public.json`. No GitHub secret is required.
3. Review the export, dates, coverage and conflicts. A successful export is not a substitute for source-data approval.
4. Run `pnpm build:pages && pnpm test:pages`.
5. Commit the reviewed snapshot and push to `main`. The GitHub Actions workflow builds, checks and publishes it.

To publish an already reviewed local cached extract instead, use `pnpm data:export`. A failed refresh or validation leaves the previous public snapshot intact. Monthly updates are manual; there is no scheduled refresh.

## Publications

Add confirmed final PDF and ReliefWeb URLs in `src/publications.mjs`. Empty destinations remain clearly labelled placeholders with disabled links. The public release includes county-brief and data downloads, but excludes the original meeting PPT until separately approved.

## Build and validate

Requires Node.js 24 and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm build:pages
pnpm test:pages
```

The deployable directory is **`dist/pages/`**, not the repository root. The build copies only the two approved boundary datasets and public county snapshot, alongside the application assets. The original `public/` directory is never copied wholesale into a Pages build.

The workflow in `.github/workflows/pages.yml` publishes on pushes to `main` or a manual run. It uses pinned actions, read-only source permissions for the build, and Pages deployment permissions only for deployment. No ActivityInfo credentials are stored on GitHub.

## Optional local live-data mode

`pnpm dev --host 127.0.0.1 --port 4381 --strictPort` starts the existing local dashboard with its read-only server API. This requires a local ActivityInfo token or private cache. Do not expose that development server publicly. The static Pages deployment is independent of this local mode.

`pnpm build` retains the alternative local/Worker packaging; the inherited Worker does not implement the ActivityInfo API. It is not used for GitHub Pages.

## Data and validation limits

See [data-quality.md](data-quality.md) for sources, methodology, the initial snapshot review and coverage caveats. Data contracts, public-file allowlists, exports, conflicts, calendar trends and map-camera preservation have automated checks. Browser-rendered QA for the latest revisions remains pending; automated checks do not certify visual layout.

The initial snapshot regression suite (`pnpm test`) includes historical expectations and may need updating after a source revision. The deployment suite (`pnpm test:pages`) validates the actual reviewed monthly snapshot without fixing a specific row count.

Boundary representations do not imply official endorsement or acceptance by the United Nations.
