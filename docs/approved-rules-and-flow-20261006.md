# Approved dashboard rules and delivery flow

Consolidated from the project conversation through 6 October 2026. These rules are project-local; AGENTS.md governs source authority. Later explicit decisions supersede earlier presentation choices.

## Data and calculation rules

- Authoritative sources: checked Matrix, combined TIDP and checked Family workbooks. Keep the approved equivalence workbook hash pinned. Never invent a link or restore a rejected alias to make totals agree.
- Include only DCMvn_Annotation Project Family records. Uploaded means distinct normalized Family identity with valid End Date through the snapshot, including Families outside TIDP. Overview and Productivity use the same shared filtered Family cohort.
- Overview's approved upload donut is an arithmetic comparison: 2,295 planned = 2,002 all-project uploads + 293 balance. This balance is not an unmatched-name list. True linked coverage remains 2,001/2,295; 294 planned names lack a link. Explain this in chart notes; Uploaded details show all 2,002 Family records.
- Plan uses native TIDP System, direct Owner, Work Type and plan search. Do not interpret Handler as Owner. Evidence-only Reporter/Handler/outcome filters retain the applicable Plan and explicitly disclose their scope.
- Family has priority for unambiguous directly linked ticket status. Retain original Matrix status and both source references; ambiguous relationships fall back to Matrix. Unmatched is historical review evidence, not authority to delete main-sheet Families. Do not invent completion dates.
- Cumulative Plan counts distinct RFA names at their earliest scheduled CFM, including combined REV/CFM markers. Actual CFM uses Actual_CFM; MEP Transmittal uses Actual_TRM. No fallback to End Date. Invalid, missing and future dates are excluded.
- CFM Forecast uses the OLS slope of cumulative Actual CFM at the last four complete ISO weeks, excludes the partial reporting week, anchors at current actual and caps at final Plan. CW36–39: 1418,1591,1792,1920; slope 170.70/week. Anchor CW40=2000; CW41=2170.70; capped CW42=2295. It is not raw fitted-intercept extrapolation.
- Other upload forecasts retain their separately defined population and method. No applicable Plan, unavailable actual/rate and reached target are distinct states; zero Plan is not completion.
- Total issues is the weekly sum of nine source X error flags among eligible Returned Families, grouped by End Date. One Family may contribute multiple types. Details contain one Family/type row per flag; this is not unique tickets or unique Families.
- Matrix total-hour KPIs retain their approved quarter-floor rule. Family-effort series use nearest-quarter half-up and a common weekly upload denominator. API supplements must not overwrite Matrix totals or classifications.

## Presentation and interaction rules

- Keep English labels and detailed error-category definitions; use consistent DC/DL/MEP/TRM/AUD/REV/CFM meanings from AGENTS.md.
- CFM legend is Actual CFM; green series is MEP Transmittal; Plan is dashed. Clicking legends toggles presentation only, not filters/calculations/exports. Hidden-series buttons have dashed borders; omit Visible/Hidden text in cumulative legend.
- Omit zero numeric labels without changing baseline points, tables or exports. Nonzero actual labels/points open the corresponding dated details. Ticket ID must contain real linked ticket identifiers, never relabelled TIDP row IDs.
- Remove the separate all-upload donut, main-page CFM provenance banner and Source review panel as explicitly requested. Preserve lineage, caveats and QA in data/details/docs. Removing UI text is not approval of proxy dates.
- Every retained panel supports collapse/expand and coordinated resizing/reflow. Preserve composable filter chips, reset, typed table search/sort and opaque sticky headers. Use shared Vite/vanilla-JS modules rather than copied page implementations.
- Snapshot copy is Snapshot recorded at 16:00 on 30.09.2026. This label does not imply independently reconstructed exact-time eligibility. Project Goals keeps the five approved goals in an accessible, prominent disclosure.

## Skills and working practice

- Use `.agents/skills/pmp-dashboard-ui-ux/SKILL.md` for UI implementation and verification, reading its project references first.
- Use source-backed analytical validation for cohort/count changes and read-only spreadsheet inspection for authoritative workbook questions.
- For experimental forecasts, calculate first, disclose window/anchor/cap and assumptions, and wait for implementation approval. Never replace source facts with a modeled result.
- Skills are execution guidance, not evidence that live UI or source data has passed verification. Report actual tests and remaining gaps.

## Update and delivery flow

1. Upload/review authoritative RawSource changes; reapprove changed equivalence mappings before updating the pin.
2. Run offline data generation and produce a coherent three-dataset release manifest with source hashes and byte checksums. Do not run credentialed API generators implicitly.
3. Validate source scope, schemas, dates, unique IDs, foreign keys, cohort reconciliation and known evidence gaps.
4. Run lint, JavaScript/Python tests, bundle validation and production build; inspect relevant browser interactions and viewport behavior. Leave local preview running.
5. Commit/push/publish only on explicit user instruction. CI regenerates from approved sources, validates, builds and deploys GitHub Pages. Check the deployed commit and workflow conclusion.
6. Update data downloads the latest published manifest/datasets without cache, checks hashes and release coherence, prepares off-DOM and commits atomically. Failed/stale requests retain the previous dashboard and filters. The button does not dispatch deployment or git pull.

## Unresolved evidence, not silently approved

Seven Actual_CFM values have upload-created proxy lineage (six within snapshot, one future). Their business acceptance remains unresolved; retain provisional metadata rather than asserting verified approval. Existing supplement event provenance/archive gaps and incomplete manual acceptance checks remain documented in the repair handoff. Publication authorization is not a resolution of those source questions.

## Local repair follow-up

Work Type-only ticket filtering uses Matrix Work Type directly, including tickets without uploaded Family links. System/Owner relationship requirements are unchanged. Arithmetic upload balance is detail-only and does not create a cohort filter. Semantic bundle validation rejects incompatible snapshot week/ISO year and nonreciprocal edges. See repair-verification-20261006.md for executed versus pending gates; no workbook policy changed.

## MIDP labels - 07/10/2026
User-approved: omit the MEP / prefix from MIDP Team / lot row labels; retain the lot label and original system filter, grouping and source values.

## MIDP Items column - 08/10/2026
User-approved: remove the Items column from MIDP tables and their CSV export. This supersedes the proposed separate Actual/Plan totals; retain weekly values and package summary counts.

## MIDP package details - 08/10/2026
User-approved: clicking the work-package title/count opens the shared detail table with all filtered planned TIDP rows counted in that summary. The disclosure arrow retains expand/collapse. Opening details does not filter or change counts.
