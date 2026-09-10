# NAWG dashboard · South Sudan

Combined interactive dashboard for GitHub Pages.

- Public site: https://un-ocha-ssd.github.io/nawg-dashboard/
- Repository: https://github.com/UN-OCHA-SSD/nawg-dashboard

## Experience

Approved full-title masthead, REACH followed by horizontal OCHA, icon navigation and light/dark modes. Eight destinations: national overview, county profiles, trends/persistence, change analysis, needs drivers, data explorer, publications/downloads, and methods/sources.

The map supports severity bands, NSS, comparable-cycle score changes, individual indicators and annual HNRP 2025/2026 severity. Monthly playback preserves the map camera and page geometry. County charts retain missing values and use dotted guides only between observed endpoints within a framework.

Reset controls are available on all eight pages. Analytical reset restores the source-specific default covered cycle, all states/bands, Twic East, comparisons and chart controls; it stops playback and resets map framing. Publication/methodology reset clears their local controls. Evidence source and theme are always retained.

## Separate evidence sources

The default **NAWG analysis archive** is an allowlisted import of the colleague-supplied site: 2,834 records across 36 cycles, through June 2026 (June–July window, August meeting). The initial cycle has 79 usable county scores. Twenty supplied final PDFs are available.

**ActivityInfo snapshot** remains independently selectable. Its current export contains January 2023–December 2025 records; November 2025 is the latest broadly covered month. Historical disagreements are not resolved by borrowing archive records. Public exports omit internal IDs, free-text notes, source coordinates and credentials. Official OCHA/UN map coordinates are retained for mapping.

The archive preserves supplied final bands and its historical label crosswalk. December 2025 starts a revised framework; direct score comparisons across that break are withheld. The imported national framework bridge is explicitly a sensitivity range, not a confidence interval. Annual HNRP severity is not a monthly NAWG score or priority rank.

See [data-quality.md](data-quality.md) for definitions and the browser regressions in [scripts/check-combined-ui.mjs](scripts/check-combined-ui.mjs) and [scripts/check-reset-ui.mjs](scripts/check-reset-ui.mjs) for interaction checks.

## Build, test and preview

Requires Node.js 24 and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm build:pages
pnpm test
pnpm test:pages
pnpm preview --mode pages --host 127.0.0.1 --port 4383 --strictPort
```

Open the repository subpath `/nawg-dashboard/`. The deployable directory is **dist/pages/**. Do not publish the repository root or the entire public folder.

Browser regression: `pnpm test:ui` (uses the separately approved automated Chrome session, default preview on port 4383). It covers all eight routes, 1465/884/783/390 widths, both themes, county search, indicators, source switching, comparisons, CSV/PDF downloads and map layers. Run the camera regression with:

Reset regression: `pnpm test:reset` checks global and page-specific defaults, repeated resets, source/theme preservation, map framing, playback cancellation, keyboard focus and responsive layouts.

```sh
QA_URL=http://127.0.0.1:4383/nawg-dashboard node scripts/check-playback-stability.mjs
```

## Monthly updates

Updates remain manual; there is no scheduled fetch and GitHub Pages needs no API credentials.

### ActivityInfo

1. Keep ACTIVITYINFO_TOKEN only in an ignored local .env.local or shell environment. Never use a VITE_ variable, commit the token, or place it in public files.
2. Run `pnpm data:refresh` after source entry and review. This privately retrieves, validates and allowlists the same form into data/nawg-public.json.
3. Review coverage/conflicts and new framework fields before publishing. An export succeeding is not source-data approval.

ActivityInfo refresh updates that source only. It does not overwrite or extend the separate analysis archive.

### Analysis archive and final reports

Import a reviewed update in the colleague site's NAWG_DATA schema with its website/reports directory:

```sh
node scripts/import-analysis-archive.mjs /path/to/colleague-data.json /path/to/website
```

The importer validates unique county/cycle rows, score ranges and every supplied cycle's mean, coverage and band counts. It writes data/nawg-archive.json and copies only the manifest's PDF files into public/reports. Original raw notes, internal IDs and the bundled colleague website are not copied.

Do not edit the history or infer additional indicators just to reconcile it with ActivityInfo. A new framework requires explicit adapter and methodology review. New months and report entries are discovered from the updated manifest. Regression expectations for June 2026 should change only after a reviewed historical correction.

ReliefWeb links remain a clearly labelled placeholder in src/Evidence.jsx until confirmed URLs are supplied. The original meeting PPT is not in the public build.

### Publish a reviewed release

1. Run `pnpm build:pages`, `pnpm test`, `pnpm test:pages`, and the browser checks.
2. Review dist/pages and the new data/publication manifest. All files deployed are publicly downloadable.
3. After approval, commit the relevant source, allowlisted data and PDFs and push to main.

The existing .github/workflows/pages.yml builds and tests on pushes to main or manual runs, then deploys dist/pages. Actions are pinned. No ActivityInfo credentials are stored on GitHub.

## Local live mode and inherited packaging

`pnpm dev --host 127.0.0.1 --port 4381 --strictPort` retains the read-only local API. Choose ActivityInfo then “Refresh local ActivityInfo” in the footer. Do not expose the local development server publicly.

`pnpm build` retains the inherited local/Worker packaging. It is not used for GitHub Pages; protected Worker and hosting files remain intact. No new dependency was required for the combined interface.

Boundaries and designations do not imply UN endorsement or acceptance.
