# KPI dictionary

## Current contract — local repair, 2026-10-06

CFM Forecast latest approved method: ordinary least-squares slope on four cumulative Actual_CFM points at the last four complete ISO weeks, excluding the partial reporting week. Anchor projection at the current reporting-week actual; cap at final CFM Plan. CW36–39 values 1418,1591,1792,1920 yield 170.70 Families/week; CW40 anchor 2000 gives CW41 2170.70 and capped CW42 2295. Nonpositive/unavailable slopes produce an unavailable forecast, never a negative projection. Other upload forecasts remain unchanged.

Latest approved presentation override: the Overview upload donut displays 2,295 = 2,002 all-project uploads + 293 arithmetic remainder. This is not a matched-coverage composition; the distinct linked coverage remains 2,001/2,295 with 294 unmatched planned keys. Separate all-upload chart is removed. Total issues means the weekly sum of nine source error flags among eligible Returned Families, not unique Families or tickets. One Family/error flag is one detail row. CFM source lineage remains unchanged despite simplified labels and removal of the main-page review/banner.

MIDP row labels omit the MEP / prefix (user decision 07/10/2026); lot labels, source team/system values, grouping and filters remain unchanged.

MIDP Items column is removed from tables and CSV (08/10/2026); weekly counts and package summary totals retain existing definitions.

This section alone defines current behavior. Sections below `Historical notes` are retained audit history, not alternative calculation rules.

| Measure | Current definition and snapshot baseline |
| --- | --- |
| Planning scope | Native TIDP System, direct Owner, Work Type and plan search. Reporter, Handler, outcomes and other evidence-only filters retain the full applicable Plan; actual/evidence scope is visibly disclosed. Handler is never interpreted as Plan Owner. |
| RFA upload coverage | Distinct normalized RFA plan keys, with approved pinned equivalence links and valid project Family End Date through snapshot. 2,295 = 2,001 linked uploads + 294 without linked upload. Hanh RFA: 413 rows, 411 keys, 406 linked, 5 unlinked. Hanh across all work types has 483 rows; these units are not interchangeable. |
| All uploaded Families | Project-filtered valid End Date uploads, including outside TIDP: 2,002 = 1,500 One pass + 501 Returned + 1 Unclassified. Outcomes come from Rework_Outcome, never ticket status. |
| Executive / Productivity uploaded headline | User-approved shared all-project upload population: both use uploadedFamilyRows on the same filtered Family cohort. Overview arithmetic donut shows 2,295 = 2,002 uploads + 293 balance; balance opens one summary record and never filters. Separate TIDP coverage remains 2,001 / 2,295 with 294 unmatched planned keys; no synthetic link is added. |
| Cumulative CFM Plan | Distinct RFA keys at earliest scheduled CFM, including combined REV/CFM markers. Scheduled CFM is not observed confirmation. |
| Actual CFM | Distinct linked Family Actual_CFM dates; no End Date fallback. CW40: 2,000. Labelled provisional source-field evidence, not verified approval. Seven upload-created proxies retain exact source lineage, six within snapshot; approval meaning and cycle history remain unresolved. |
| MEP Transmittal | Distinct linked Family Actual_TRM dates, no fallback; CW40: 2,001. Detail/CSV uses Actual_TRM rather than End Date. |
| CFM forecast | OLS on complete cumulative CW36–39 points 1418,1591,1792,1920; slope 170.70/week, anchored at CW40 actual 2,000; CW41 2170.70, CW42 capped at 2,295. Forecast is an estimate, not a schedule or approval. |
| TIDP upload forecast | Separate upload scenario: target 2,295, linked End Date actual 2,001, complete-CW rate 143.25/week. CW41–43 increments 143.25,143.25,7.5. Weekly observed throughput still counts all 2,002 uploads. |
| Empty forecast | No positive applicable target = no_applicable_plan; missing actual = actual_unavailable; positive reached target = reached; absent positive rate = rate_unavailable. Zero target never implies completion. |
| Ticket status | User decision: prefer one unambiguous directly-linked Family Ticket_Status. Preserve original matrixStatus and familyStatuses, with statusSource. Ten assigned→resolved disagreements remain in typed QA with both source cells. No completion date is invented. Multi-ticket/ambiguous status falls back to Matrix. |
| Ticket hours | Preserve Matrix hours/classifications; quarter-hour floor per ticket, including Re-Assessment as Positive. Raw 40,233.51 → 40,233.50 total; combined Positive 38,021.76 → 38,021.75. Fifty-five missing values remain unknown. |
| Average Family effort | All three series share weekly unique upload denominator. Chart-specific nearest-quarter half-up on source ticket and API person hours. CW21: 9 Families; total 113.50/9, MEP 98.25/9, DC 15.25/9. Missing history is unavailable, not zero. |
| Weekly spent hours | Approved API supplement for Matrix Positive/Re-Assessment, work-date ticket-week signed nets floored to 0.25 h; never overwrite Matrix totals. No API generator is invoked by data:build. |
| Source population/QA | Family_vs_Tickets project scope remains primary. Seventeen historical Unmatched overlaps do not remove Families; 44 CFM-before-TRM records are cycle-review warnings, not automatic date fixes. Meta counts/timestamps remain historical. |
| Snapshot | Dates use calendar-day eligibility through 2026-09-30, not independently reconstructed exact 16:00 events. |

Refresh/startup requires all three JSON datasets and a coherent versioned SHA-256 manifest. Byte integrity, schema, IDs, references, dates and source hashes are checked before detached rendering and an atomic commit. Failure restores prior runtime/DOM; later requests supersede older pending ones. See `data-bundle-contract.md`.

## Historical notes — not current calculation rules

## Weekly linked issues by error type (05/10/2026)

Latest interaction: chart legends toggle presentation-only line visibility, not reworkError cross-filters. Counts and weekly evidence remain unchanged; the donut/heatmap retain their separate shared filters. Axis step changes spacing only. Hidden-series state is independent from Reset Filters.

Supersedes Created/Completed throughput in the Issues view. Nine lines count X flags for distinct uploaded Returned Families per source error column, grouped by Family End Date ISO week, last eight weeks ending at the reporting snapshot. A Family can enter several types, but each Family/type/week counts once regardless of ticket count. Source error flags do not identify error-discovery dates or specific tickets in multi-ticket Families. Missing types/weeks in a nonempty valid cohort are measured zero. Month bands use ISO Thursday. Shared filters apply before aggregation; legends select reworkError, marks and the weekly-value disclosure open supporting Family records. No authoritative values are changed.

## Average recorded hours per Family by week

Latest rounding instruction: this chart alone rounds Matrix original ticket hours and API net ticket/person hours to the nearest 0.25 h (halfway toward the larger value), before aggregation. Divide all series by the shared Weekly Family uploads count; display the resulting averages to two decimals without quantizing the averages themselves. Other KPIs and the weekly-spent chart keep their current rounding. Rebuild API role output from the saved sanitized history with build_family_role_hours.py. Tickets 74149 and 72836 now total 4.00 and 6.00 h. Supersedes floor-rounding descriptions below.

Latest user instruction: all three series divide by the identical unique uploaded-Family count for that ISO week, matching Weekly Family uploads under shared filters. Role denominators no longer depend on positive participation. Complete history with zero role hours yields zero; missing histories and weeks without uploads remain unavailable. This supersedes the distinct role-denominator definitions below. CW21 now gives DC 15.25 / 9 = 1.6944 h/Family; MEP 98.25 / 9 = 10.9167, total 113.50 / 9 = 12.6111. Do not force reconciliation by changing authoritative hours.

Reconciliation checked 04/10/2026: CW21 has 9 uploaded Families, Matrix total 113.50 h (12.6111 h/Family). MEP has 98.25 h / 9 contributing Families (10.9167); DC has 15.25 h / 8 (1.90625). The distinct denominators explain why role averages do not sum to total. On a common denominator of 9, DC contribution is 1.6944 and the sum equals 12.6111. Across CW21–CW40, API person totals equal Matrix weekly numerators except CW33/CW34, each 0.25 h lower after separate per-person quarter-hour flooring. No Other-role hours occur in the current cohort. Two-decimal display rounding can also prevent displayed sums from matching. Keep authoritative Matrix values unchanged.

User-approved role breakdown (04/10/2026): MEP Modeler and Digital Coordinator are attributed to actual time-log authors in API history, never Handler or Matrix involvement flags. For each upload cohort, net snapshot lifetime hours are floored to 0.25 h per ticket/person; sum the selected role's unique ticket/person hours and divide by unique Families linked to tickets with positive net hours from that role. Both groups can contribute to the same Family. These are separate role-cohort averages, not additive parts of the blue Matrix average. Unknown roles are excluded from role numerators. Incomplete API histories, unparsed events or ambiguous deletions leave affected weeks unavailable. Click a role mark for recorder/ticket hours. Future weeks remain blank. Matrix values are not overwritten or forced to reconcile with API attribution.

CW20–CW40/2026, grouped by valid authoritative Family End Date through snapshot, same uploaded-Family and shared-filter scope as the average KPI. For each upload week: sum known nonnegative Actual Hours of unique directly linked Matrix tickets (already quarter-hour floored) / count unique uploaded Families. Shared tickets count once within a week, but may contribute to more than one week; never add weekly numerators into a project total. Missing hours are excluded only from the numerator and disclosed. No uploaded Families or no known hours yields unavailable (dash/line gap), not measured zero. The division remains exact and is displayed to two decimals. This is recorded effort for the uploaded cohort, not elapsed duration, not actual effort occurring in that same week, and not a staff efficiency ranking. No unlinked project-wide ticket hours enter this chart. Sources remain the authoritative Family/Matrix workbooks; the API weekly-spent chart retains its distinct metric.

## Weekly Annotation Project hours

User-approved read-only time history supplement: all Matrix Positive/Re-Assessment tickets, CW01–CW40/2026, through snapshot calendar date. Each weekly value sums net time added minus deleted with work dates in that ISO week, floored per ticket/week to 0.25 h. It is weekly spent hours, not hours assigned to a ticket's closing/upload week and not cumulative effort. Original workbook total-hour KPIs are unchanged. Missing API histories and unrecognized time entries produce an explicit incomplete warning; audit differences are retained in weekly-hours.json. Dates outside the requested ISO-year/week range are excluded from chart totals but included in lifetime reconciliation. See data-model.md for reproducibility, snapshot and rounding limitations.

## Executive composition charts

### Applied temporary equivalence, 04/10/2026

All rows of `Annotation_RFA_equivalence_Checked.xlsx / Equivalence` are temporarily accepted per user instruction, including proposed/temporary decisions and their supplied targets. Source names, dates, outcomes and Ticket_IDs remain unchanged. The current baseline supersedes old exact-only figures below: 2.295 unique TIDP names = 2.001 uploaded matches (87,2%) + 294 No upload match (12,8%). Original upload population remains 2.001 = 1.500 One pass + 501 Returned. MIDP weekly RFA Actual and cumulative Actual use `linkedUploadDates` through familyId, with original Family End Date and snapshot rules; forecast recomputes its four-complete-week rate. All relevant filter paths use those same links. Supplemental workbook version and temporary approval are in dataset meta.equivalence; build rejects an unapproved changed workbook. Rebuild with `npm run data:build`, test with `npm test` and `python -m unittest discover -s tests -p "test_*.py"`.

Uploaded Families on Issues & Productivity counts unique normalized Family Name values in the project-filtered Family_vs_Tickets sheet with a valid End Date through the snapshot, including families outside the TIDP match population. Outcomes use the authoritative Rework_Outcome field: One_pass → One pass, Returned → Returned, missing/other values → Unclassified. Source update retrieved on 4 October 2026: 2,001 = 1,500 One pass + 501 Returned; Unclassified is zero. These outcomes are not derived from ticket count, Active or ticket status. Outcome selections filter related Matrix tickets and TIDP rows through the existing direct/derived links. The interpretation note and filter dropdown panel are removed from the page by user request.

Issues & Productivity uses all Matrix classifications by default and respects shared filters. Open issues retain current non-resolved/non-closed status. Open >30 days measures calendar age from Created Date to the snapshot. Weekly creations use valid Created Date; weekly completions require resolved/closed plus valid End Date through the snapshot. The chart uses eight ISO year-week keys ending at the snapshot week, whose partial coverage is labelled. Invalid/missing/future completion dates are excluded from throughput and exposed separately. Recorded effort sums known nonnegative Actual Hours (the existing quarter-hour rule), without distributing hours into weeks. Hours per completed issue divides the known hours of dated completed tickets by that same population's record count; missing hours are excluded and an empty denominator displays unavailable. Zero hours are valid. This metric varies with work type, scope and complexity and is not an individual productivity score. Sources and links remain governed by the three authoritative workbooks.

MIDP Actual is weekly, not cumulative: RFA counts unique normalized names in each Work Type/System lot, exact-matched to project-filtered Family records using earliest valid End Date through the snapshot. Upload is not approval. Non-RFA rows explicitly count Matrix tickets (not TIDP deliverables): Positive/Re-Assessment, resolved/closed, valid End Date, exact Work Type and a single explicit system token in the summary. ELT/MSR maps ELT or MSR; SPR MED requires both tokens; ambiguous/missing systems are not assigned from reporter. Plan measures activity markers, so these different units must not be subtracted as a planned-completion variance KPI. Zero/future Actual cells are visually blank.

Family catch-up forecast is an explicitly labelled scenario. Rate = net unique uploads across the four last complete ISO CWs / 4 (exclude the partial reporting week). Forecast starts at the actual reporting snapshot and rises at that rate, capped at the final planned count. Catch-up CW = reporting CW + ceil((final plan - actual) / rate). Final plan is held constant after CW42 for comparison, not treated as an approved future schedule. Zero rate yields no forecast; already-reached scope yields no projected segment. Plot horizon is bounded to 52 additional CWs. Actual observations are unchanged. Baseline CW36–CW39 rate: (1862 - 1301) / 4 = 140.25/week; 1933 actual versus 2295 planned implies CW43.

Family progress replaces Management Attention in Overview. Grey Plan is cumulative unique RFA names by minimum first scheduled CW. Blue Actual counts unique matching families at their earliest Family End Date, explicitly confirmed by the user as the actual upload milestone. Each ISO CW includes dates through Sunday, capped at the snapshot date; future actual weeks are not plotted. Family records are project-filtered before matching and share the dashboard filter scope. Upload is not an approval claim.

Positive Tickets by Reporter counts Matrix tickets with Active = Positive or Re-Assessment, grouped by Reporter across all statuses. Blank reporters remain in Unknown reporter. Reporter selection composes with shared filters and follows direct Ticket-to-Family relationships into related TIDP rows.

Annotation Project Ticket Count counts unique Matrix Ticket IDs across all statuses in the shared filter scope. Positive includes Active = Positive or Re-Assessment; Negative includes Active = Negative. This is a ticket count, not an hours total or an open-ticket-only backlog measure.

Actual Hours are rounded down per ticket to the nearest 0.25 hour before aggregation: `floor(source hours × 4) / 4`. Exact quarter-hour boundaries remain unchanged; missing hours remain missing. Original workbook values are retained as `actualHoursSource` in the derived dataset. Ticket #67303 changes from 316.01 to 316.00 displayed hours; project total is 40,233.50 h and combined Positive is 38,021.75 h.

- TIDP Family Upload counts unique normalized family names in `Revise the RFA library` rows, not all deliverable rows. Exact matching uses only uploaded records where `Project Name` is `DCMvn_Annotation Project`. Baseline: 2,295 names = 1,933 uploaded matches + 362 without an uploaded match.
- Annotation Project Ticket Hours sums `Matrix.Actual Hours` once per ticket, grouped by the source `Active` classification. Baseline: Positive 18,650.50 h + Negative 2,211.75 h + Re-Assessment 19,371.26 h = 40,233.51 h. Missing hours (55 tickets) are excluded, not asserted as measured zero.
- Approved dashboard rule: source Re-Assessment is included in Positive. Positive = 38,021.76 h; Negative = 2,211.75 h; total = 40,233.51 h. Source workbook values remain intact. Unclassified is omitted from the chart.
- Positive Hours by Work Type groups the combined Positive population by primary Matrix Work Type and sums Actual Hours once per ticket. Legend values reconcile to the Positive total and compose with other active filters.
- Legend selections compose with existing filters; each selection can be toggled off or removed via a chip. Chart panels use native disclosure controls and preserve collapsed state during filtering/navigation.

| KPI | Business meaning | Formula | Source | Filter behaviour | Interpretation |
| --- | --- | --- | --- | --- | --- |
| Total deliverables | TIDP work-item population | Count of TIDP rows | TIDP | All global filters | Planning scope, not completed output count |
| Current-week deliverables | Work planned in reporting week | Count with non-empty CW40/2026 | TIDP | System, owner, work type | Current delivery load |
| Future planned | Work with a planned marker after reporting week | Count where finish week > 40 | TIDP | Global | Remaining visible plan |
| Past plan, unverified | Final planned week has passed and completion evidence is unavailable | Finish week < 40 | TIDP | Global | Management must confirm completion; not labelled overdue |
| Open tickets | Active operational backlog | Status not in resolved/closed | Tickets | Department, handler, work type, status | Work still open |
| Aging-critical tickets | Old unresolved work | Open and age > 30 days | Tickets | Ticket filters | Escalation candidate; not contractual overdue |
| Average open age | Mean age of current backlog | Average(as-of − created) for open tickets | Tickets | Ticket filters | Backlog age profile |
| Average resolution time | Typical elapsed working time | Average supplied Duration for resolved/closed | Tickets | Ticket filters | Historical throughput |
| Uploaded families | Available content records | Count of main family rows | Family Upload | Category, uploader, ticket status | Uploaded population only |
| TIDP family coverage | Planned RFA work with uploaded exact match | Matched RFA work rows / all RFA work rows | TIDP + Family | System, owner | Derived content readiness coverage |
| No uploaded match | Planned RFA work without exact uploaded match | RFA work rows − matched rows | TIDP + Family | System, owner | Requires review; not proof of absolute absence |
| Data quality issues | Records/relationships requiring correction | Sum of visible rule counts | All | Dataset-aware | Source confidence and action queue |

`Completed Deliverables`, `On-time Delivery`, `Overdue Tickets`, `Ticket Due This Week`, `Family Approval` and previous-period variance are shown as unavailable when the required evidence is absent. They are never replaced with fabricated values.

# Uploaded-Family scope for Issues and Productivity

- Uploaded Family: distinct normalized Family identity in the authoritative project-filtered Family workbook, with valid End Date <= snapshot. This is not the narrower TIDP-matched upload count.
- Issues: distinct directly linked Matrix tickets only. Open/aging/completed rules are unchanged, but applied to the uploaded-Family cohort.
- Weekly uploads: distinct uploaded Families grouped by ISO week of Family End Date. Current reporting week is partial; these are uploads, not approval events.
- One-pass rate: source `Rework_Outcome = One_pass` Families / all uploaded Families in the active scope. Unknown outcomes remain in the denominator.
- Linked recorded effort: sum usable Actual Hours of distinct linked Matrix ticket IDs, once per ticket even if linked to multiple Families. Missing hours remain missing. This is total recorded effort for the selected cohort, not hours worked during the selected upload week and not individual efficiency.
- Reproducibility: `npm run data:build` from the three authoritative RawSource workbooks, then `uploadedFamilyCohort` / `familyProductivity` in `src/family-outcomes.js`. Snapshot is carried from dataset metadata, not the build date. The existing quarter-hour flooring rule is preserved before hour aggregation.

## Productivity averages

- Average uploads / day: unique uploaded Families in the current filtered cohort divided by inclusive calendar days from that cohort's earliest Family End Date to the snapshot. Includes zero-upload days; not a working-day or current-week rate. No dated Families produces unavailable.
- Average recorded hours / Family: known recorded hours of directly linked unique tickets divided by all uploaded Families in the current cohort. Shared tickets are counted once. Missing ticket hours are excluded from the numerator and disclosed; this is a partial recorded-effort average, not cycle time or individual efficiency. No usable hours produces unavailable.
- Weekly Family uploads uses a line chart of weekly counts, not cumulative totals. The snapshot week remains partial. Points and week labels apply shared upload-week filters; numeric counts open evidence records.

## Returned tickets by number of error types
Counts distinct Matrix Ticket IDs directly linked to at least one uploaded Returned Family through the snapshot. The error-type count is the union of recorded reworkErrors across all such Families for that ticket, with each type counted once. It is derived association evidence, not a per-ticket error record. Current filters select eligible tickets; bucket classifications retain the full uploaded Returned-Family scope so filtering does not reclassify tickets. Zero classified errors is an explicit bucket when present. Missing Matrix IDs are excluded. At the current snapshot: 502 unique linked tickets; 1 type=168, 2=71, 3=245, 4=17, 5=1. Family totals remain 501 and are not replaced by ticket totals.

Heatmap Total sums each error-type column across all system buckets (including unknown/multiple), preserving once-per-Family/type counting. Heatmap and returned-error donut detail tables keep Family rows but display all linked Ticket IDs in their first column.
# Cumulative Family Plan: CFM milestone

MEP Transmittal counts distinct TIDP-linked Families cumulatively by source Family_vs_Tickets.Actual_TRM. Each ISO week uses its Sunday cutoff capped at the snapshot. Blank, invalid or future dates are excluded without End Date or Actual_CFM fallback. Future weeks are blank, not forecast. The CFM-based Actual/Forecast calculations remain unchanged.

Actual now uses Family_vs_Tickets.Actual_CFM, not End Date, for distinct TIDP-linked Family confirmations through the reporting snapshot. Missing, invalid and future dates are excluded without fallback. The four-complete-week Forecast rate is recalculated from this same confirmation series. Weekly uploads and other upload KPIs continue using End Date.

Plan counts distinct normalized Families in Revise the RFA library TIDP rows at their earliest scheduled CFM (Confirm) week, including combined activity cells such as REV | CFM. Families without a CFM marker are excluded from Plan. Duplicate Family rows count once. Actual upload dates and population remain unchanged; scheduled CFM is not evidence of completed confirmation. Forecast target follows this revised Plan.

TIDP Family Upload presentation override (08/10/2026): arithmetic donut remains 2002/293. Separate owner bars count 2001 linked uploads and 294 planned names without links; one outside-TIDP upload is disclosed separately. No owner allocation of arithmetic remainder. See decision register.

Ticket Hours owner stacks (08/10/2026): same scoped Matrix tickets and actualHours as the donut, grouped once by unambiguous linked TIDP owner first, otherwise canonical owner of the unambiguous System in ticket summary; ambiguous and unresolved owners remain explicit. Positive includes Re-Assessment. Segment sums reconcile to donut hours; no API recorder attribution is implied. Family coverage inline notes removed; arithmetic versus linked-coverage lineage remains in disclosure/docs.

Ticket Hours stacked-bar override (08/10/2026): group by authoritative Matrix Reporter, superseding the preceding owner-attribution rule. Preserve exact username keys, display canonical names, and use Unknown reporter for missing values. Same scoped tickets, recorded hours and Positive/Re-Assessment classification as donut; no System/owner attribution.

Ticket Count reporter stacks (08/10/2026): same scoped Matrix tickets as donut, grouped by exact Reporter and Positive/Negative classification (Re-Assessment included in Positive), one count per ticket. Segment totals reconcile with the donut. Shared Reporter filtering and exact ticket details apply.

Uploaded outcome/error owner stacks (08/10/2026): owner derives from approved Family System assignment via familyErrorSystems and canonical System-owner mapping. Outcome stacks count uploaded Families once; error stacks count Returned source flags once per Family/type. Unknown/multiple buckets preserve totals. No source values or original donut cohorts change.

Returned tickets by number of error types excludes zero-classified-error tickets (08/10/2026). Apply errorCount > 0 to donut, owner stacks, percentages and detail cohort only; retain them in other Returned metrics. Current chart total: 501.

Positive Work Type reporter stacks (08/10/2026): recorded Matrix actualHours for same Positive/Re-Assessment cohort as donut, grouped by Reporter and primary Work Type. Sum reconciles to donut; exact usernames remain filter keys, canonical names display where available.
