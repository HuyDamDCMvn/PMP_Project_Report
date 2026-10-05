# Repair candidate — 05 October 2026

Local, uncommitted candidate on `codex/repair-dashboard-bff2eeb`, based on `bff2eebf808a034cb9770759574b0808141c43e8`. No push or publication performed for this repair. No authoritative workbook modified. Implementation follows the project UI/UX skill and source-backed data validation; source workbooks were inspected read-only.

Preview: http://127.0.0.1:4173/PMP_Project_Report/ (compiled build). Development server remains available at http://127.0.0.1:5173/PMP_Project_Report/.

## Decisions applied

- Evidence filters retain the applicable native Plan; actuals and ticket metrics disclose their selected evidence scope.
- Family is preferred for unambiguous linked ticket status. Original Matrix status and both source-cell references remain available. Ambiguous relationships retain Matrix fallback rather than inventing a status.
- Family population is not removed simply because a ticket also occurs in Unmatched.
- CFM proxies remain provisionally retained, with explicit lineage and warnings, pending the user's business decision. This is not acceptance of those dates as independently verified approval events.

## Repair coverage

| Spec | Candidate implementation |
| --- | --- |
| PMP-01 | Separate native Plan, Family and ticket evidence cohorts; owner is not Handler; evidence scope disclosed. |
| PMP-02 | Explicit forecast states for missing Plan, unavailable actual/rate, reached target and valid projection. |
| PMP-03 | All-project uploads remain 2,002; TIDP-linked upload forecast uses its own 2,001 actual and 2,295 target. |
| PMP-04 | Hash-verified three-dataset bundle, coherent release validation, detached preparation and rollback on failed commit; latest refresh request wins. |
| PMP-05 | CFM source-field labels, separate CFM/TRM detail dates and provenance; no End Date substitution. |
| PMP-06 | Narrow-chart external labels yield to full HTML legends; bounded donut height, responsive wrapping and local chart scrolling. |
| PMP-07 | Read-only QA for 10 status conflicts, 17 historical-sheet overlaps and 44 CFM-before-TRM cases. |
| PMP-08 | Seven pinned created-at proxies have explicit evidence metadata; six fall within snapshot and one is future. Business acceptance remains open. |
| PMP-09 | RawSource helper defaults to read-only dry run; isolated candidate generation, validation and explicit publish flag; no live publication tested. |

## Checked numerical contracts

| Scope | Result |
| --- | --- |
| Full TIDP RFA coverage | 2,295 distinct planned keys; 2,001 matched; 294 not matched |
| Hanh Pham RFA coverage | 413 source Plan rows; 411 distinct planned keys; 406 matched; 5 not matched |
| RFA work-type selection | Retains 2,295 / 2,001 / 294 coverage |
| Reporter bn.hoai | Plan retained; evidence-scoped actuals; unavailable rate is not reported as target reached |
| Source-field CFM / TRM | 2,000 / 2,001 through snapshot |
| Productivity | 2,002 uploaded Families; 15,953.25 linked recorded hours |
| TIDP-linked upload forecast | CW36–39 rate 143.25/week; CW41–43 increments 143.25, 143.25, 7.5 |
| Ticket hours | 40,233.5 total; 38,021.75 Positive; 2,211.75 Negative |

Status priority changes ten derived ticket statuses without editing source workbooks or inventing resolution dates.

## Verification

- JavaScript tests: 59 passed, zero failures.
- Python tests: 14 passed, including isolated helper dry-run/missing-input/dirty-index safety tests.
- Lint: passed, 42 files. Production build: passed. `git diff --check`: passed.
- Offline bundle validation: passed; repeat offline generation produced the same semantic release.
- Browser checks: Owner, work-type and Reporter scopes; refresh retaining Reporter selection; CFM CW40 details showing 2,000 records and separate Actual_CFM column; no horizontal document overflow at 390, 768, 1024, 1180 and 1440 widths.
- Final compiled screenshots: [desktop](repair-desktop-1440.png), [mobile](repair-mobile-390.png). Compact external SVG labels are intentionally omitted while HTML legends retain exact values.
- CFM CSV action displayed preparation for 2,000 rows, but browser download observation timed out. Downloaded file contents were not independently verified.
- Not completed: 200% zoom pass, exhaustive TRM-detail/legend interaction checks, real-browser refresh fault injection, and all isolated publish-helper failure modes (remote advancement, copy failure, validation failure). Unit tests cover several bundle failure and refresh-race cases; this is not equivalent to all browser scenarios.
- Only the forecast-state regression was explicitly observed failing before implementation. Do not interpret all new tests as demonstrated baseline failures.

## Bundle and provenance limitations

Semantic release: `928d4b1e8c98269dbbb5d0a65b2b16531d288a89bf8899f89bb0f0142f21f44e`.

Exact source and dataset SHA-256 hashes are recorded in `public/data/bundle-manifest.json`. Source hashes were checked against the current workbooks. No ticket API generator was run. Existing sanitized role/time supplements were retained; role-history archive hashes and independent event provenance remain unavailable and are disclosed in manifest warnings. The source-field CFM cutoff is calendar-day based, not an independently reconstructed 16:00 event snapshot.

This candidate is not a declaration that all spec acceptance gates are complete. Before acceptance, choose whether to retain the seven upload-created CFM proxies as provisional evidence or exclude them from the CFM metric, then rerun the affected count/forecast checks. Remote publication needs a separate explicit instruction.
