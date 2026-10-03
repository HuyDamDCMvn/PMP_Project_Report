# Data analysis and relationship model

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
