# Data provenance and quality

Checked on 9 September 2026 against the supplied read-only [ActivityInfo form](https://www.activityinfo.org/resources/query/v43/form/cdqmo0mmmapb33se). The private snapshot is deliberately outside public assets. The public release contains a separate allowlisted county-data export, not the raw snapshot.

| Check | Result |
| --- | --- |
| Raw records | 2,281 |
| Distinct reporting months | 30, January 2023–December 2025 |
| Boundary features | 79, including Abyei Region |
| Unmatched county names after reviewed alias | 0 |
| Invalid year/month rows | 0 |
| Duplicate county/month groups | 49 |
| Conflicting metric groups | 36, withheld from scores and trends |
| Latest broadly covered month | November 2025: 71/79 usable scores |
| Most recent partial month | December 2025: 8/79 usable scores |

## Rules

- The grain is one county per calendar month. Names are normalized for case/punctuation; there is no fuzzy matching.
- The explicit `Abyei Administrative Area` → `Abyei Region` alias reconciles the source to boundary SS0001. Source and boundary centre coordinates were checked for consistency. Administrative names do not imply a legal position on boundaries.
- An available edited NSS or band takes precedence over its original field. Zero is preserved; blank edited scores fall back to originals.
- Duplicate groups are compared across NSS, band, source severity, vulnerability/trigger scores and all eight indicators. Identical metric groups collapse to one cell; notes are retained. If any of those metrics differs, the entire cell is flagged conflicting. Original variants remain accessible in the county indicator table and downloads. This conservative rule can withhold a score even if the NSS alone agrees.
- Coverage counts usable, non-conflicting NSS observations over the 79 boundary features; it does not imply that every indicator is complete. The default period is the newest with at least 80% usable NSS coverage, falling back to the newest available period only if none meets that rule.
- Comparisons use the selected calendar months. Missing/conflicting values yield no numeric difference. Trend gaps are not interpolated, forward-filled or zero-filled. Dotted visual connectors may span interior gaps between observed endpoints; these guides do not supply observations, tooltip estimates or exported values.
- Band values remain those of the source. Existing records use A/B1/B2/C/D (or unclassified), not the illustrative A–F design categories. Filters and legends discover new source codes by period. No thresholds are inferred and historical bands are not recoded. Any future methodology change must be documented before comparing across methods.
- Eight source indicator/severity pairs are used. The supplied form has no separate climate or conflict indicators, so these are not invented from the presentation.
- The county brief is a downloadable HTML document with print/Save as PDF controls. The supplied September 2026 PPT is separately available as a publication; it is not represented as the source of the current 2025 map values.

## Trend connector chart contract

- Question: how does the selected county's reported score change over calendar months? Observed values remain the evidence; dotted connectors make interior gaps easier to follow without claiming measurements within them.
- Family/variant: monthly line with solid observed segments, observed-point markers and dotted gap guides. Use the existing dashboard-native Recharts renderer in the overview and county page, including NSS, vulnerability and trigger measures.
- Grain/sufficiency: the existing 12/24-month calendar series from ActivityInfo; draw a guide only across one or more unavailable months bounded by finite observed values. Preserve zero, conflicts and nulls. No leading/trailing extrapolation; retain the existing no-data state.
- Palette/encoding: existing single blue chart-line token in both themes; solid versus dotted lines distinguish observed runs from guides without relying on colour. No markers on unavailable months.
- Footprint/delivery: unchanged responsive trend canvas and constant explanatory caption on the local dashboard at port 4381. Tooltips and CSV use the original monthly series, not derived estimates.
- QA: test gap endpoints, multiple gaps, zero, conflicts, sparse series and unchanged source/export values. Build both routes from the shared component; rendered light/dark and narrow-width QA remains pending the recorded browser-testing choice.

## Geographic source

[OCHA Common Operational Datasets, global Admin2 layer](https://gis.unocha.org/server/rest/services/COD/GLB_COD_Admin2/MapServer/0), queried with `adm0_pcode='SS'`, WGS84, simplification tolerance 0.002 degrees and coordinate precision 5. `public/data/counties.geojson` retains county/state names, pcodes and label centres. No generated geography is used.

## Readiness

GitHub Pages publication was authorized for `UN-OCHA-SSD/nawg-dashboard`. The static release keeps the interactive React/Leaflet/Recharts interface and approved county metrics; it excludes free-text notes, record identifiers, source coordinates, credentials and the original meeting PPT. All score, band and conflict decisions are checked against the private model before export. Refreshing the public page only reloads published data; monthly data changes require a reviewed export and deployment. Public data files are downloadable by visitors. No ActivityInfo token is stored in GitHub or the published site.

The annotation revision adds 24 regional line features from [UN World International Boundaries](https://gis.unocha.org/server/rest/services/Hosted/World_International_Boundaries__Adm0___Line/FeatureServer/0), queried over 20°E–39°E / 2°S–16°N with `bdytyp_integer > 0`, WGS84, 0.002° simplification and five decimal places. `public/data/international-boundaries.geojson` retains source URL, retrieval time and line-type attributes. Solid international, dashed undetermined/administrative and dotted separation lines are distinguished. County and international layers have independent provenance and may differ slightly in detail. Boundaries do not imply UN endorsement.

The timeline contains all 36 calendar months across the source range although only 30 have reports. Unreported months remain missing; no scores are synthesized. Date menus now show dates only, with coverage separately explained. Indicator cards preserve exact source classifications and inputs; raw inputs are not converted to comparable percentages. Conflicting submissions remain separately inspectable and do not replace withheld county scores. Raw IDs remain in downloads, without the former visible record-ID heading. Monthly PDF/ReliefWeb slots have null destinations and disabled actions; they do not imply published products.

Suitable for a clearly labelled local review of source-reported county conditions. Not a verified 2026 meeting dataset yet. Before partner publication, resolve conflicting records where possible, confirm the intended administrative denominator and band methodology, verify the uploaded 2026 coverage, and agree who can access the records and meeting presentation. The UI surfaces coverage and limitations rather than certifying the underlying assessments.
