# Local repair verification — 6 October 2026

Baseline: c632c5f6d2e3a2bea08cc02b8455af4e4b90bfea. Follow-up to PMP_Project_Report_Agent_Repair_Spec_c632c5f_20261005.md.

No authoritative workbook or approved equivalence mapping changed. Semantic release remains 928d4b1e8c98269dbbb5d0a65b2b16531d288a89bf8899f89bb0f0142f21f44e.

## Implemented

- PMP-01: Work Type-only filters retain native ticket population; System/Owner relationship gates retained. RFA 2435 tickets / 20644.25 h; combined Positive 2304 / 18578.50 h; ticket 75949 retained. Native RFA Plan stays 2301 rows / 2295 keys.
- PMP-04: reject missing/blank RFA keys, non-null non-RFA keys, inconsistent snapshot week, wrong identity types, duplicate edges and nonreciprocal edges before preparation. Existing checksums, source hashes and atomic commit/rollback remain.
- PMP-05: active Overview drawer and tests use uploadDetails: 2002 uploads, arithmetic summary 2295 / 2002 / 293. Historical linked-coverage helper remains explicitly labelled. Current documentation uses CFM OLS 170.70, anchor 2000, cap2295.
- PMP-10: arithmetic legend opens detail and never sets upload filter. Native button keyboard handling avoids synthetic double activation. Summary exports arithmetic headers, not a Family list.
- PMP-09: added Windows CI job using python unittest and exact powershell executable guarded by tests. Remote CI has not been run or published in this task.

## Executed evidence

Local commands: npm run lint; npm test (66 pass, zero skips); python -m unittest discover -s tests -p "test_*.py" (16 pass, zero skips); node scripts/validate_bundle.mjs; npm run build.

Browser local default viewport: arithmetic legend Enter and Space opened one record with 2295/2002/293. Close/Escape restored trigger focus. No chips appeared and ticket totals stayed2703/40233.50. RFA legend produced2435/20644.25, Positive2304/18578.50. Source and forecast tests retain2000 CFM,2001 TRM and170.70 OLS.

## Remaining evidence boundaries

Seven CFM proxies remain provisional; six are eligible at snapshot. No business decision to exclude proxies has been made. Supplemental role/time provenance warnings are retained. Browser fault injection was executed on an isolated copy at port5180: injected prepare throw and commit throw after DOM replacement, mutated schema before preparation, and a mocked503 fetch response. Every case preserved RFA chips, Overview page and values2295/2435/20644.25/18578.50/2304; Update was reenabled. Real200% browser zoom and exhaustive publication-race/copy-failure cases remain not run; these are not claimed passed. Local changes are not remotely published.

## Acceptance receipts

| Cases | Status | Evidence |
| --- | --- | --- |
| COHORT-01–04 / UI-01 | Pass | Native ticket tests and browser RFA selection |
| UPLOAD-01–02 / UI-02–04 | Pass | Active view-model2002 uploads; summary2295/2002/293; Enter/Space/Escape tested |
| CFM-01–05 | Pass | Active detail selector tests2000/2001; independent date field and CFM kind/cell |
| BUNDLE-02–09 | Pass, unit | Required keys, week/ISO-year, reciprocal references, duplicate edges, identity/orphan guards |
| BUNDLE-11/13/15 | Pass, unit | Corrupt bytes, deployment race and request generation tests |
| BUNDLE-16–17 | Pass, browser injected | Actual prepare/commit functions in isolated source copy; exceptions preserve DOM values and runtime filters |
| UI-08 | Pass, browser selection | Uploaded KPI detail status search resolved:141 total records |
| UI-14 | Pass | Same release Update reports already latest, stays Issues & Productivity |
| UI-16 | Pass |390/768/1024/1180/1440px screenshots inspected; document scrollWidth<=viewport width |
| UI-07 | Pass, serialization unit; download capture blocked | Active Uploaded CSV serializes2002 data rows; browser download event timed out, not claimed captured |
| UI-17 | Not run | Real browser zoom unavailable through current IAB control; resizing is not reported as zoom |
| HELP-01–05/07–09/11–12 | Pass, isolated fixture | PowerShell tests exercise dry-run/preflight/branch/dirty index/remote advance, six failing gates, candidate-only, unexpected untracked file, no-op, publication to fake bare remote |
| HELP-06/10 | Not run | Copy failure and remote-race immediately before publish not exhaustively injected |
| PMP-08 | Provisional retained | No proxy exclusion decision requested; default release policy preserved |

Helper tests stub candidate build/npm validation gates to exercise orchestration. Production workbook tests, lint, JS tests, bundle validation and build run independently; stubbed fixture output is never production data.

Rollback: revert only this local implementation diff to c632c5f after preserving subsequent user changes. Authoritative sources are unchanged; never reset the user's checkout or restore old sources to roll back UI.
