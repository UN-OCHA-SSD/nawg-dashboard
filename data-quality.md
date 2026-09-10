# Data provenance and quality · ActivityInfo migration

Checked 10 September 2026, after the user corrected the Year field. This checks dashboard transformations, not the validity of the underlying humanitarian assessment.

## Source and grain

The read-only ActivityInfo form `cdqmo0mmmapb33se` is now the sole monthly source. The retrieved response has 2,912 rows; the static allowlisted snapshot has 2,834 dated county/month rows. There are 36 observed periods, January 2023–June 2026, mapped to 79 official OCHA county polygons.

- 78 rows have Year = “Not classified” and Month = “Not classified”. They are excluded and counted in snapshot metadata and the methodology page; no records were deleted or modified in ActivityInfo.
- Dated rows have no unmapped county names or duplicate county/month keys.
- June 2026: 79 usable scores, mean 6.328987342 (6.33 displayed), median 6.16; A=12, B=6, C=39, D=21, E=1. Eighteen counties are in A–B.
- May–June 2026: 79 paired counties, eight band changes. Twic East: 6.60, C, +0.25.
- Climate and conflict numeric/classification fields are now present in ActivityInfo. They are part of the public allowlist, duplicate detection, maps, driver analysis, county cards and downloads.

## Historical source differences retained as supplied

For Abyei Administrative Area in September, October, November and December 2023, ActivityInfo reports original NSS 0.75 and edited NSS 0. The retired archive used 0.75. The dashboard retains the explicit edited zero; it does not treat zero as missing or replace it with archive values. Intentionality of these four edited zeros is unconfirmed. The data owner requested publication with ActivityInfo as the sole source; no values were altered or inferred. Any correction must be made in ActivityInfo and included in the next release.

The four corresponding monthly means differ from the former archive by approximately 0.75/79. All other observed monthly coverage/mean comparisons reconcile to the prior archive within its published rounding tolerance (0.0006).

## Calculation rules

Final/edited scores and bands take precedence, with original fields used only when the edited field is absent. Zero remains valid; classifications are not recalculated from numerical thresholds. Missing and “Not classified” source fields stay unclassified.

State/county filters recompute metrics with equal county weights, not population weighting. Changes require the same county in both periods within the same framework. Missing observations are excluded, never imputed. Conflicting metric records are withheld; equivalent duplicates collapse. Climate/conflict and the bounded classification context participate in conflict detection.

The revised framework starts December 2025. Earlier labels A/B1/B2/C/D/E are preserved, not relabelled. Very severe/extreme membership is A/B1 before the break and A/B after it; severe-or-above additionally includes B2 or C respectively. Colours use the period's framework. Mixed-framework band-history legends distinguish earlier from revised labels. Score differences and dotted county chart connectors cannot cross the break.

Persistence uses at most 12 observed reporting cycles in the selected framework, at least min(3, window cycle count) observations and the displayed share threshold. County trend gaps remain missing in tooltips and downloads.

## References, not monthly sources

`data/nawg-reference.json` preserves only framework definitions and the manifest for 20 PDFs. It contains no observations, annual severity values or historical comparison series.

At the user's request for ActivityInfo-only data, annual HNRP figures and the fixed framework sensitivity study have also been removed from the dashboard. The PDF library remains reference material; PDF figures do not feed interactive calculations.

The manual archive importer and monthly archive have been removed from the project; original user documents elsewhere are untouched and the former tracked files remain recoverable from Git history.

## Publication boundary

Snapshot schema 2 includes only approved county labels, periods, metrics/classifications and a small, bounded classification-context category. Context distinguishes IPC methodological restrictions, technical corrections, contextual notes, final-result differences and no recorded change; it does not expose notes or infer an independently verified meeting decision.

Free-text notes, internal IDs, tokens and source coordinates never enter the public bundle. The current source URL, retrieval date and aggregate excluded-row count are retained. Build validation rejects unmatched counties, invalid score ranges, unknown bands, unapproved fields/metadata and inconsistent quality totals.

Monthly public updates still require a reviewed GitHub Pages release. No automatic upstream writes, scheduled refresh or API credentials are added to GitHub.

## Verification

- Model and export tests reconcile all 36 periods directly to ActivityInfo rows and exercise zero preservation, climate/conflict conflicts, date exclusion, privacy and missing-data handling.
- Browser regressions cover eight routes, indicators, county search, historical/revised bands, resets, chart interactions, CSV/PDF downloads, the absence of retired annual map layers and both themes.
- Playback and county-menu regressions check fixed map/browser scale, unchanged page geometry and no dropdown-induced sideways scrolling.
