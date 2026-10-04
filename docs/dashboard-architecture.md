# Dashboard architecture and wireframe

Data update flow: every main push or manual deploy workflow run installs pinned pandas/openpyxl, rebuilds dashboard-data.json from the three approved RawSource workbooks and pinned equivalence, validates/tests/builds, then publishes Pages. Generated JSON is included in the deployment artifact, not committed back. Equivalence changes fail closed until reviewed and its approved hash updated. API-hour supplements are published from their existing approved snapshots; CI does not access ticket credentials. Snapshot remains the configured reporting date, not the deployment date.

Update data downloads all three JSON files from the latest successful Pages deployment with no-store requests and a 30-second timeout. Failures retain existing data. Success rebuilds lookups/context and rerenders while preserving filters, page, visibility, axis and collapse settings. The button does not dispatch Actions or pull files into the local checkout; pending/failed deployments do not become live. No GitHub token is stored in browser code.

`chart-order.js` owns sibling-panel ordering after shared layout wrappers are created. Stable layout keys identify panels; saved orders are deduplicated and reconciled with current panels so removed keys disappear and new panels append. Pointer/touch drag on the title and arrow keys on the same title button use one reorder operation, move existing DOM nodes, and persist per page/group. Group boundaries, chart size/collapse, filter state and evidence registries remain independent. The separate arrow toolbar is removed; Home restores only the current group's default chart order.

The project-wide Weekly Annotation Project hours panel is an explicit exception to the uploaded-Family-only Productivity scope. `weekly-hours.js` consumes sanitized static API history, intersects Matrix ticket IDs with the shared filter scope, and registers ticket-week evidence in the existing drawer. `spentWeek` is distinct from uploadWeek/activityWeek: it joins work-date time entries to tickets, then linked Families/TIDP. Shared collapse/resize and CSV exports remain unchanged. API credentials are used only by the read-only Python build script, never client JavaScript.

## Decision architecture

The application is ordered by `Decision → Evidence → Action`. Executive health and management attention appear before operational trends. Every interactive count opens a traceable record list or detail drawer.

## Interaction architecture

All data-backed components use a shared, bidirectional cross-filter state. Clicking a filterable value or data mark in any KPI, chart, heatmap, matrix, table or legend filters every other component connected by a valid data relationship. Each component is therefore both an input to and an output of the current filter context.

Selections from different components are composed as an intersection and remain visible as removable filter chips. Re-selecting the active value toggles it off; `Reset Filters` clears all visible and hidden selection state. Components with no matching related records show a filtered-empty state instead of ignoring the active filter or reverting to unfiltered data. Expand/collapse, sorting, pagination, help, source trace and detail-opening actions are not filter actions unless explicitly labelled.

## Sitemap

1. Executive Overview — health, evidence gaps, current-week work and priority actions.
2. MIDP / TIDP — weekly plan, system status, current/future load and detailed work items.
3. Annotation Tickets — backlog, aging, ownership, throughput and ticket detail.
4. Family Readiness — uploaded population, TIDP coverage, ticket state and exact-match gaps.
5. Dependencies — TIDP → family → ticket → owner trace and dependency matrix.
6. Issues & Productivity — open issues, weekly throughput, handler queues and recorded effort.
7. Data Quality — missing fields, contradictions, orphans and unsupported KPIs.

## Page wireframes

### Executive Overview

```text
┌ Sidebar ┬ Project / Week / Filters / Reset / Last updated ──────────────┐
│         │ Title + evidence note                                          │
│         │ KPI row: TIDP | Current week | Past plan* | Open tickets | RFA │
│         │ Health strip: Schedule | Tickets | Families | Load | Quality   │
│         │ MANAGEMENT ATTENTION (ranked, evidence + owner + action)        │
│         │ Current-week by system        │ Backlog aging                   │
│         │ Upcoming plan                 │ Evidence limitations            │
└─────────┴─────────────────────────────────────────────────────────────────┘
```

### MIDP / TIDP

Filter-aware KPIs → CW35–CW42 timeline → status composition → system ranking → operational table → detail drawer.

### Annotation Tickets

Backlog KPIs → status stack → aging buckets → handler workload → creation/closure trend → ticket table.

### Family Readiness

Uploaded/linked/coverage KPIs → readiness by system → category ranking → ticket-state composition → critical no-match list.

### Dependencies

Relationship confidence summary → dependency state bars → traceable matrix with TIDP, schedule, family, ticket, owner and relationship label.

### Issues & Productivity

Uploaded Families outcome donut → issue pulse → weekly Created/Completed throughput → aging and status → handler queue and effort by work type. Counts open searchable evidence records. Family outcomes use source Rework_Outcome and link into the shared filter state. Throughput uses End Date; effort uses recorded Actual Hours. Pure metrics and person matching live in issues.js, Family outcome selectors in family-outcomes.js; the renderer in issues-view.js reuses shared panel and drawer contracts.

### Data Quality

Quality summary → issue counts by dataset → unsupported KPI register → source limitations → affected records.

## Visualization specification

| View | Visual | Metric / dimension | Interaction | Reason |
| --- | --- | --- | --- | --- |
| Executive | KPI cards | Core filtered counts | Click to open records | Fast management scan |
| Executive | Health strip | Five semantic health states | Click navigates to owning page | Compact multi-domain status |
| Executive | Attention list | Rule, impact, owner, action | Open source trace | Action is more important than history |
| TIDP | Timeline/heatmap | Work items by week/system | Week and system cross-filter | Shows current delivery concentration |
| TIDP | Horizontal bars | Items by system | Click-to-filter | Accurate ranking |
| Tickets | Stacked bar | Ticket status | Status filter | Composition without a pie |
| Tickets | Aging bars | Open tickets by age bucket | Bucket filter | Highlights stale backlog |
| Tickets | Workload bars | Open and critical by handler | Handler filter | Resource decisions |
| Family | Progress/bars | Exact uploaded match by system | System filter | Readiness coverage |
| Dependencies | Matrix/table | Schedule, family, tickets, owner | Row drill-down | Traceability beats decorative networks |
| Team | Heatmap | Weekly work count by person | Metric switch and cell filter | Capacity pattern over time |
| Data Quality | Issue bars/table | Rule counts and source | Open affected records | Makes missing evidence visible |

## Technical flow

```text
Excel snapshots
  → Python validation and normalization
  → compact JSON data contract
  → centralized JavaScript domain rules
  → filter state
  → page renderers and traceable detail drawer
  → Vite static build
  → GitHub Pages
```

The browser never calculates relationships by fuzzy matching. Important thresholds live in one configuration object and domain functions are unit-tested.

Table exports use a per-render registry of table models (ordered columns plus complete scoped rows, or a live detail-selection getter). `selectTableRows` is shared between the detail renderer and CSV export, including pending search values; pagination/infinite scrolling only limits DOM rendering. `serializeCsv` and `downloadCsv` in table-export.js own escaping, UTF-8 encoding, safe text cells, local download and URL cleanup. MIDP exports are built by midpTableExport from the same grouped plan and actual records used to render the paired table.

Temporary equivalence extension (04/10/2026): the Python build applies the user-approved, hash-pinned `Annotation_RFA_equivalence_Checked.xlsx` mappings after exact matching. Endpoint validation rejects unknown project Families, unknown TIDP targets, duplicate mappings and exact-link collisions. Original Family keys and Ticket_IDs stay intact. `family-links.js/linkedUploadDates` resolves dates by generated familyId for both MIDP and cumulative progress; no chart independently guesses aliases. Source Decision, Method, Confidence and row are retained for audit. A workbook version change requires renewed approval rather than silently accepting new mappings.

# Uploaded-Family analysis views

Issues & Productivity is one sidebar page (internal ID `team`). `renderFamilyAnalysis` composes the unchanged Issues and Productivity renderers inside two independent native disclosure groups. Their stable layout scopes (`team` and `productivity`) preserve prior inner-panel size and collapse keys. Both use `uploadedFamilyCohort`: unique project-filtered Families with a valid End Date at or before the snapshot, and unique Matrix tickets linked by their source Ticket_IDs. No unlinked project tickets enter either group. Existing MIDP/Overview populations remain unchanged; this grouping does not resolve TD001.

Issues contains rework composition, returned-Family count, linked open/aging/completed issues and weekly issue events. Productivity contains unique uploads, upload-week output, one-pass share, linked recorded effort, uploader distribution and effort by handler. Shared rendering primitives in `issues-view.js` own cards, breakdowns, weekly charts and typed evidence drawers.

`uploadWeek` filters Family End Date by ISO year/week; `uploader` filters the source uploader. Both propagate through direct ticket IDs and Family-linked deliverables, compose with existing filters, survive navigation and clear through chips/reset. Ticket event week remains separately named `activityWeek`.
