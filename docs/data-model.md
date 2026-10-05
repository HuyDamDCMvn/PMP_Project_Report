# Data analysis and relationship model

Current population and cohort/status contracts are in `kpi-definition.md` (Current contract). The primary Family sheet has 2044 full records / 2002 project records; any 2043 figure below is historical. Current joins keep native planning rows, including unmatched rows, separate from selected ticket/Family evidence. Derived ticket status prefers unambiguous Family status while retaining Matrix originals. Bundle schema, lineage and QA are documented in `data-bundle-contract.md`.

System × error heatmap counts the same Returned Family X flags as the donut. System is derived only from approved Family-to-TIDP links: a single distinct System is used; none means Unknown system; more than one means Multiple systems. These buckets count each Family/error once, preserving the donut total. errorSystem filtering propagates via direct Family ticket IDs and approved linked TIDP rows; it is separate from the existing planning System filter. Computation and rendering live in rework-heatmap.js; authoritative source files are unchanged.

Family records retain reworkErrors from the nine X-marked error columns in authoritative Family_vs_Tickets. Only project-filtered uploaded Returned Families enter the error donut; each marked column counts once per Family. Source flags do not identify individual erroneous tickets in multi-ticket Families. The disclosure therefore reports unique linked tickets separately from error-flag totals without claiming a per-ticket classification.

The user additionally authorizes actual-recorder API attribution for the Family-effort chart (04/10/2026). Rebuild with `python scripts/build_family_role_hours.py`. It reads only tickets directly linked to project-filtered uploaded Families, validates the API project, applies the snapshot calendar-date cutoff, and exports sanitized ticket/person totals to `family-role-hours.json`. Roles are parsed from the checked-in AGENTS.md personnel mapping. The ignored `.time-history-cache/person-hours/` stores sanitized author usernames and time events for resumable reads. Credentials, email addresses and raw notes are never exported. A deletion reverses an earlier matching work-date/hour addition from the same author, or from an unambiguous sole original author. Ambiguous cross-author deletion is an evidence gap, not assigned to the person deleting it. Time-log author is the attribution available in the API; on-behalf-of entry cannot be independently established. Clear only that cache when requesting a fresh attribution refresh.

## User-approved weekly time-history supplement (04/10/2026)

Role attribution matches deletion display precision within 0.005 h of an earlier same-work-date addition, preferring the same author and otherwise requiring a sole unambiguous author. It applies the exact signed deletion value to that author, preserving residuals before flooring, rather than dropping the original addition entirely. The build currently exports complete attribution for all 2,002 linked tickets; future gaps remain explicit.

The user authorizes read-only ticket API history for the weekly Positive-hours chart only. Matrix remains authoritative for Ticket IDs, classifications, names and total-hour KPIs. `scripts/build_weekly_hours.py` reads only those Positive/Re-Assessment ticket IDs, validates the API project, and exports sanitized time events; credentials and raw ticket notes never enter public data. The ignored `.time-history-cache/` retains only work dates, signed hours and edit timestamps for resumable reads. Remove this cache before a fresh API refresh. Rebuild with `python scripts/build_weekly_hours.py`; output is `public/data/weekly-hours.json`.

`Time allocated` adds hours; `Time allocated Deleted` subtracts hours. Parse the work date from old_value, supporting d.m.yyyy / yyyy-mm-dd and comma decimals. Preserve repeated legitimate events rather than deduplicating date/hour pairs. Exclude work dates and history edit dates after the snapshot date. API edits are filtered by calendar date; this is not an exact 16:00 point-in-time reconstruction. Net per ticket/ISO week, floor to 0.25 h, then aggregate CW01–CW40/2026. Weekly rounding can differ from flooring a lifetime ticket total; never force-match the chart to workbook totals. Negative nets are retained for audit, not clamped to zero. API failures and unknown time formats remain explicit incomplete evidence, not measured zero.

The exported per-ticket audit compares net snapshot history with original Matrix hours, including out-of-period hours. Differences are diagnostic only and do not overwrite authoritative values. The chart is project-wide, unlike the uploaded-Family cohort widgets. Shared filters act through scoped Matrix ticket IDs; `spentWeek` joins sanitized time entries to tickets and then direct Family/TIDP links.

## Source inventory

| Dataset | Authoritative sheet | Rows | Role in the model |
| --- | --- | ---: | --- |
| MIDP/TIDP | `TIDP_Combined` | 2,512 | Planning backbone with 38 weekly columns from CW05 to CW42/2026 |
| Annotation Tickets | `Matrix` | 2,703 | Operational workflow, ownership, actual work dates, hours and status |
| Family Upload | `Family_vs_Tickets` | 2,043 | Uploaded Revit content and its mapped annotation tickets |

The three files in `RawSource` have the same SHA-256 hashes as the files supplied from `Downloads` on 2 October 2026.

## Field interpretation

### MIDP/TIDP

- Grain: one detailed work item per system and work type.
- Dimensions: `System`, `Person In Charge`, `Work type`, `Detailed work item`.
- Schedule: non-empty `CWnn/2026` cells are planned activity markers. Values include `CFM`, `TRM`, `REV`, `AUD`, and combined values.
- Missing fields: actual start, actual finish, explicit status, priority, milestone and project ID.
- Consequence: completion, on-time delivery and schedule variance cannot be asserted from this source. The dashboard uses `Past plan · completion unverified` when the final planned week has passed.

### Annotation Tickets

- Grain: one ticket.
- Identifiers: unique `Ticket ID`; no duplicates in the supplied matrix.
- Status values: `new`, `acknowledged`, `assigned`, `resolved`, `closed`.
- Ownership: `Handler` is used as the operational owner; the user matrix columns are evidence of involvement, not responsibility.
- Dates: `Start Date` is the first real assignment event; `End Date` is completion evidence from resolution/closure/status or confirmation notes. They are not contractual due dates.
- Missing fields: due date, priority, explicit blocker flag, related TIDP ID and discipline.

### Family Upload

- Grain: one uploaded family.
- Key: normalized `Family Name` for analysis; original text is always retained.
- `Ticket_IDs` provides direct family-to-ticket relationships.
- `Rework_Outcome` is retained as `reworkOutcome`: One_pass and Returned are source classifications; blank values remain unclassified. Ticket count and Active are not substitutes for this field.
- Dates: retain source Start Date and End Date. The project user confirms End Date as the actual upload milestone for the cumulative upload chart; each normalized family is counted once at its earliest recorded End Date.
- Missing fields: required date, separate upload timestamp, approval status, revision due date and explicit TIDP ID.
- The `Unmatched` sheet contains 59 family names that also appear in the main sheet; this is exposed as a source-sheet contradiction rather than silently choosing a status.

## Relationships

04/10/2026 temporary policy supersedes the exact-only coverage below: all mappings in `Annotation_RFA_equivalence_Checked.xlsx / Equivalence` are provisionally accepted by the user, without editing the three authoritative workbooks. Family retains `key`, `name`, dates and direct tickets; `tidpEquivalence` retains both endpoints, source row/decision/method/confidence and applied temporary decision. TIDP retains its original `familyKey` and receives `familyId`, `familyMatchMethod` and `equivalenceRow`. The mapping adds 68 distinct links, for 2.001 matched unique planned names out of 2.295; the 294 remaining names are unmatched, not proven unuploaded. Counts of work-item rows must remain distinct from unique names.

MIDP non-RFA Actual additionally derives system-lot ticket aggregates from unambiguous explicit system tokens in Matrix Ticket Summary plus exact Work Type. This does not establish a one-to-one TIDP-to-Ticket link. Missing/ambiguous system summaries remain unassigned and reporter is not a substitute.

| Relationship | Classification | Method | Limitation |
| --- | --- | --- | --- |
| Family → Ticket | Direct | `Ticket_IDs` in `Family_vs_Tickets` | Some ticket IDs may be outside the ticket matrix snapshot |
| TIDP → Family | Derived | Exact normalized family name; case/punctuation ignored and `.rfa` suffix removed | Applied only to `Revise the RFA library`; no fuzzy matching |
| TIDP → Ticket | Derived | TIDP → Family → Ticket chain | Valid only when the derived family match exists |
| Ticket → Handler | Direct | `Handler` | Blank handler remains visible |
| TIDP → Owner | Direct | `Person In Charge` | Two missing owners |
| Discipline | Probable | `System` is treated as the planning discipline/system | Ticket data has no matching system field |

Current derived coverage is 1,936 of 2,301 RFA work-item rows (84.1%). The other 365 rows are labelled `No uploaded match`; this does not prove the family is absent from every possible source.

## Data quality checks

The processing layer checks missing ticket dates/handlers, duplicate ticket IDs, missing TIDP owners, unscheduled TIDP rows, duplicate family names, family-sheet contradictions, family ticket IDs absent from the ticket matrix and unlinked TIDP RFA rows.

## Derived metrics

- Planned start/finish week: first/last non-empty TIDP week cell.
- Current-week delivery load: number of work items with a marker in the reporting week.
- Ticket age: reporting date minus `Created Date` for unresolved tickets.
- Resolution time: supplied `Duration` for resolved/closed tickets.
- Family readiness: `Uploaded match` when a TIDP RFA row has an exact normalized match in the uploaded-family list; otherwise `No uploaded match`.
- Dependency state: schedule evidence + family match + related unresolved ticket state.

No black-box risk score is used.
