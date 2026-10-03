# MIDP source extension contract

Current input: `RawSource/DCMvn_TIDP_Combined_20260930.xlsx`, sheet `TIDP_Combined`, normalized by `scripts/build_dashboard_data.py`. No other input is currently imported. Rebuild with `npm run data:build`.

Current hierarchy: major package = Work Type; provisional lot = System. This is an aggregation of supplied planning markers, not an approved contractual batch schedule or actual completion report.

`src/midp.js` exports the pure `aggregateMidp(records)` function. A future Digital Team adapter must output the existing deliverable contract (`id`, `title`, `system`, `owner`, `workType`, `weeks: [{week, activity}]`, planned start/finish), plus `teamId: "DIG"` and an explicit `batchId` when supplied. IDs must be namespaced by source. The renderer and aggregation already accept team/batch fields without requiring new per-team UI code.

When the user supplies Digital Team TIDP, first inspect its workbook/sheets, year, CW conventions, lot identifiers, canonical people and revision scope. Obtain confirmation that it becomes an authoritative source and update AGENTS.md's whitelist before ingestion. Do not automatically scan/import arbitrary RawSource files. Add a source-specific adapter to the builder, retain workbook/sheet/row lineage, and reconcile replacement revisions by stable source IDs rather than appending duplicate snapshots. Do not infer missing lot IDs or actual completion. Extend the calendar contract before mixing different years. Preserve existing Family project restrictions and exact-name relationships.
