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

## TIDP checklist source correction - 08/10/2026
User-approved source edit: TIDP_Combined D2456:D2464 (TIDP-2455 through TIDP-2463), RLT / Lam Truong, changes Work type from Create Revit templates for each LPH to Output Checklists. Names, ownership and CW39 TRM / CW40 AUD / CW41 REV / CW42 CFM remain unchanged. Package totals become 14 templates and 64 checklists; overall planning population is unchanged.

## Weekly linked issues upload line - 08/10/2026
User-approved: retain Total issues and nine error lines; add a solid Uploaded Families line from the same weekly unique End Date cohort as Weekly Family uploads, including all outcomes. Use the existing count axis. No cumulative TRM or upload forecast is added.

## TIDP owner rings - 08/10/2026
Latest user override: TIDP Family Upload uses linked coverage 2001 Uploaded + 294 No linked upload = 2295 distinct planned keys. Exclude the one outside-TIDP upload from this chart only. Inner ring splits upload linkage status; outer ring groups each status by direct TIDP owner. Multiple owners remain explicit. Segment details use the exact planned-key population; owner legends compose the shared Owner filter. This supersedes the prior arithmetic donut presentation; all-project upload measures remain unchanged.

## Owner bar chart replaces outer donut - 08/10/2026
Latest approved override: restore arithmetic donut 2002 Uploaded / 293 remainder, remove outer owner ring. Add owner bars for true linked coverage 2001 Uploaded / 294 without linked upload, plus a separate one-upload outside-TIDP note. Never distribute the arithmetic 293 remainder to owners. Bars open exact planned-key detail; owner names filter shared Owner.

08/10/2026 presentation follow-up: integrate the owner bars inside the TIDP Family Upload panel below its donut, sharing collapse/resize. Preserve all approved arithmetic versus linked-coverage definitions and interactions.

08/10/2026: owner coverage uses one absolute-count stacked bar per owner (Uploaded green + No linked upload amber), with a common maximum-owner-total scale. Exact segment values and total remain visible; segment details and owner filters retain existing behavior.

08/10/2026: remove the two inline Family owner-coverage explanatory paragraphs; preserve lineage in chart disclosure and documentation. Integrate Positive/Negative recorded Matrix ticket hours as stacked bars by unambiguous linked TIDP owner, otherwise canonical System owner (ticket summary system), with explicit Multiple owners or Unknown owner. Count each ticket once; Re-Assessment remains Positive. Owner labels use shared Owner filters; segments open source ticket details. No hours-source or upload-count change.

08/10/2026 latest override: Ticket Hours stacked bars group by Matrix Reporter, replacing System/TIDP owner attribution. Preserve source reporter usernames as grouping/filter keys and display canonical names where available. Missing reporter = Unknown reporter. Each ticket contributes recorded hours once; Positive includes Re-Assessment. Names filter Reporter; segments open exact reporter/classification tickets. Family owner bars remain unchanged.

08/10/2026: integrate Positive/Negative stacked bars by Matrix Reporter in Annotation Project Ticket Count. Same scoped ticket population/classification as donut; each ticket counts once. Canonical display names preserve exact reporter username filter keys; missing reporter remains Unknown reporter. Names compose shared Reporter filters; segments open exact reporter/classification ticket details.

08/10/2026: add integrated side-by-side owner stacks to Uploaded Families (One pass/Returned/Unclassified) and Returned error types (source flags by type). Use existing approved familyErrorSystems links/responsibility exception and canonical System owners. Unknown/multiple owners remain explicit; each Family counts once per outcome/type, with no ticket-count substitution. Owner names use shared Owner filters; segments open Family evidence with Ticket IDs. Reflow below donut on narrow screens.

08/10/2026 layout follow-up: owner stacks for Uploaded Families and Returned error types sit to the right of the donut on wide screens, reflowing below on narrow screens. Remove per-owner error-type value paragraphs; retain exact values in segment title/accessible label and source detail. No calculation changes.

08/10/2026 presentation override: compact Uploaded Families legend values beside labels. Returned error types places legend to the right of donut on wide screens and owner stacks below the donut/legend row. Narrow screens reflow vertically. Values, filtering and detail behavior unchanged.

08/10/2026: show exact numeric labels on Returned error owner-stack segments. Small segments place numbers above the bar; preserve accessible values, source details and counts.

08/10/2026: compact Returned error legend into short rows with inline count/percentage, allocate more width to donut. Add numeric segment labels to Uploaded Families owner stacks; preserve counts and detail interactions.

08/10/2026: Returned tickets by number of error types gains owner stacks on the right, compact legend and larger donut area. Owner uses approved System responsibility across all linked Returned Families; ambiguity remains Multiple owners, missing assignment Unknown owner. Each existing returned ticket counts once in its error-count category; segments open exact ticket evidence. Narrow screens reflow vertically.

08/10/2026 user override: exclude returned tickets with zero classified source error types from Returned tickets by number of error types, its owner stacks and details. Other Returned Family/ticket metrics remain unchanged. Current chart population becomes 501 tickets; #72578 remains Returned elsewhere but is excluded here.

08/10/2026: donut labels and legends display underscores as spaces; preserve original source/filter keys.

08/10/2026: balance Returned ticket distribution layout with a centered donut/compact aligned legend on the left and owner stacks on the right, consistent gaps and bar heights. No population or interaction change.

08/10/2026 latest layout override: Returned tickets by number of error types places donut left and legend right in the top row, with owner stacks spanning the row below. Narrow screens stack vertically. Supersedes preceding side-by-side owner layout; counts and interactions unchanged.

08/10/2026: Positive Hours by Work Type adds reporter stacks below donut-left/legend-right row. Group exact Matrix Reporter usernames and Work Type, summing same Positive/Re-Assessment recorded hours once per ticket. Reuse donut colors, numeric segment labels, Reporter filters and source-ticket details. No API attribution or source change.
