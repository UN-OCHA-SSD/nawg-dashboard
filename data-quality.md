# Data provenance and quality · combined dashboard

Reviewed locally on 9 September 2026. This is validation of the dashboard's transformation and presentation, not independent verification of underlying humanitarian assessments.

## Evidence sources

| Source | Coverage in this build | Treatment |
| --- | --- | --- |
| Supplied NAWG analysis archive | 2,834 county-cycle records, 36 cycles, January 2023–June 2026 | Default source. June 2026 has 79/79 usable scores. |
| ActivityInfo public snapshot | 2,281 rows, 30 reported months, January 2023–December 2025 | Separate source. November 2025 has 71/79 usable scores; December has 8/79. |
| OCHA county boundaries | 79 county polygons, including Abyei Region | Shared map geometry; exact reviewed name aliases only. |
| Annual HNRP intersectoral severity | 2025 and 2026, scale 1–5 | Separate annual context, never a monthly measure or priority rank. |
| Final publications | 20 PDFs supplied with the colleague site | Actual local downloads; ReliefWeb URLs still pending. |

Archive input: extracted colleague-data.json (window.NAWG_DATA) from the user-supplied OneDrive_1_9-9-2026 archive. Prepared date: 08 September 2026. Public output: data/nawg-archive.json, produced reproducibly by scripts/import-analysis-archive.mjs. Free-text notes, note indices, record IDs, embedded geography and unnecessary site metadata are excluded.

ActivityInfo input: the supplied read-only form cdqmo0mmmapb33se. The public snapshot remains data/nawg-public.json; token and private cache stay outside public assets. It has 49 duplicate county/month groups, including 36 conflicting metric groups. Conflicts are withheld; identical metrics collapse. The supplied archive and ActivityInfo sometimes disagree historically. The application does not average, backfill or select across these sources.

## Grain, periods and aggregation

- One resolved county per cycle. The archive cycle is the first month of a two-month analysis window; the meeting happens later. June 2026 means June–July analysis with an August meeting.
- Coverage counts counties with usable NSS, not completeness of every indicator. The latest cycle with at least 80% coverage is initially selected.
- NSS is the supplied final/edited score with first-level/original fallback where appropriate. Numeric zero remains valid.
- Means and medians use all non-missing scores in the current county selection with equal county weight, never population weighting. Missing values do not become zero.
- State and band filters recompute overview summary figures and chart cohorts. The inspector remains the explicitly selected county; if outside map filters it is labelled. Other analytical pages expose state filters, not hidden band restrictions.
- Comparisons pair counties with usable observations in both cycles and use the same framework. They do not compare independently varying national denominators.
- Persistent high severity defaults to bands A–B (archive), with an explicit severe-or-above A–C alternative. Threshold is at least 80% of observed cycles, up to the last 12 reported cycles in the selected framework. At least min(3, window cycle count) observed cycles are required; observed and possible cycle counts are displayed.
- Associations and indicator contributions are descriptive, not causal claims. Classification shares use non-missing classified counties as their denominator.

## Framework and classification

The revised archive framework starts December 2025. Climate and conflict are genuine source fields in that revised archive, not inferred ActivityInfo indicators. Earlier records explicitly show those fields as not in the framework.

The supplied archive harmonises earlier band labels A/B1/B2/C/D/E to A/B/C/D/E/F. The adapter retains the source label in audit and export. ActivityInfo retains its own period-specific labels. Relabelling does not make scores comparable across frameworks.

Final bands are never recalculated from numeric NSS. IPC restrictions and meeting adjustments are preserved as supplied adjustment codes. June 2026 has 12 Band A counties: 10 coded IPC methodological restriction, one meeting adjustment, and one no adjustment. The two IPC phase-4-or-above counts are separate signals, not population estimates.

County and national trend lines break at the framework revision. Dotted county guides bridge interior missing/conflicting observations only within a framework; they do not create values, tooltip estimates or export rows with inferred scores. No leading/trailing extrapolation.

The national framework bridge is imported from the colleague's sensitivity analysis and retained for all 79 counties independently of state filters. It reapplies earlier UVS/IPC weights, excludes climate/conflict, retains contextual adjustments, caps at 10, and varies low displacement-flow treatment between bounds. Its published-series values reconcile to the archive. Bounds are an imported analytical model, not independently re-estimated assessment evidence or confidence intervals.

## Reconciliation checks

Every archive cycle's coverage, mean (within rounding tolerance 0.0006) and band totals reconciles to the supplied cycle metadata. All 2,834 records map to official county polygons without invalid dates, duplicate keys or unmatched names.

June 2026: 79 scored counties, mean NSS 6.328987342 (displayed 6.33), median 6.16, A=12, B=6, C=39, D=21, E=1, F=0. There are 18 counties in A–B and eight band changes versus May 2026 across 79 paired counties. Twic East: final 6.60, Band C, +0.25 versus May.

Annual HNRP values stay independent of the selected cycle, including cycles with no monthly data. The reference is labelled annual and is never presented as a priority rank.

## Geographic source

County geometry: [OCHA COD global Admin2](https://gis.unocha.org/server/rest/services/COD/GLB_COD_Admin2/MapServer/0), South Sudan filter, WGS84, 0.002-degree simplification, five-decimal coordinates. Existing name/pcode and label-centre attributes are retained.

International lines: [UN World International Boundaries](https://gis.unocha.org/server/rest/services/Hosted/World_International_Boundaries__Adm0___Line/FeatureServer/0), 24 regional features with source line-type styles. Solid, dashed and dotted special-status boundaries remain distinguishable. Source layers can differ in detail. The archive's Abyei and ActivityInfo's Abyei Administrative Area match the OCHA Abyei Region polygon.

Names, boundaries and designations do not imply UN endorsement or acceptance.

## Release boundary

The combined build is prepared for GitHub Pages but has not replaced the public deployment. It contains approved county-level metrics, official geometry, actual partner logos and supplied final PDFs. It excludes original meeting PowerPoint, free-text source notes, internal record IDs and credentials. New monthly inputs and PDFs require human review before a push triggers deployment.

Browser checks cover source switching, all routes, maps, filters, downloads, missing periods and the timeline's preservation of camera, browser scale, scroll and page dimensions. See design-qa.md for the rendered review and evidence paths.
