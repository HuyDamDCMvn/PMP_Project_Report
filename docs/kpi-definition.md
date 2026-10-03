# KPI dictionary

## Executive composition charts

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
