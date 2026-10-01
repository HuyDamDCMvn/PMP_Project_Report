# Dashboard architecture and wireframe

## Decision architecture

The application is ordered by `Decision → Evidence → Action`. Executive health and management attention appear before operational trends. Every interactive count opens a traceable record list or detail drawer.

## Sitemap

1. Executive Overview — health, evidence gaps, current-week work and priority actions.
2. MIDP / TIDP — weekly plan, system status, current/future load and detailed work items.
3. Annotation Tickets — backlog, aging, ownership, throughput and ticket detail.
4. Family Readiness — uploaded population, TIDP coverage, ticket state and exact-match gaps.
5. Dependencies — TIDP → family → ticket → owner trace and dependency matrix.
6. Team & Resource — weekly workload across TIDP, tickets and family responsibility.
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

### Team & Resource

Metric switch → team × week heatmap → current open/critical backlog ranking → combined responsibility table. High load is described as load, never performance.

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
