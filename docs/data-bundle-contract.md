# Offline data bundle and safe publication

`python scripts/build_dashboard_data.py` rebuilds the primary dataset, adds readonly cell lineage/QA, applies user-approved Family status priority, then packages the existing supplements. It never calls the ticket API or repairs source workbooks.

`bundle-manifest.json` schemaVersion 1 records snapshot, SHA-256 source hashes, semantic releaseId, generator, rounding policies, evidence warnings and exact SHA-256/byte length for dashboard-data, family-role-hours and weekly-hours. Each dataset carries the same releaseId/schemaVersion/asOf. The release identity excludes generated timestamps but includes semantic changes to supplements.

The weekly supplement's Matrix hash must match the current authoritative Matrix. Role history lacks a verified source archive hash: this is an explicit warning, not fabricated provenance. If source/supplement versions no longer agree, stop and review/rebuild the supplement from authorized evidence; never edit metadata merely to pass validation.

Startup and Update data share `fetchPublishedData`/`validateBundle`. Read manifest → verify all bytes → reread manifest → validate nested schemas → prepare detached markup/lookups → commit. A changed deployment is rejected for retry. Rendering failure restores old runtime and DOM. Controllers reject stale older requests. Update uses releaseId, so supplement-only semantic changes are not reported unchanged.

Validation command: `node scripts/validate_bundle.mjs` (offline, no source writes).

## Publication helper

`scripts/push_rawsource_local.ps1 -DryRun -Files ...` is readonly, including Git index/refs; it does not fetch, checkout or pull. All inputs are preflighted against the three authoritative filenames; supplemental equivalence updates need separate review. Branch mismatch stops without checkout.

`-Execute` requires a clean source clone and unchanged remote HEAD, then creates an isolated temporary candidate. It copies only preflighted inputs and runs offline data build, Python tests, npm ci/lint/test/build and bundle validation. Failures retain the candidate for inspection and leave the user's original checkout/index unchanged. Without `-Publish`, no commit/push occurs.

Publication additionally requires `-Publish` and explicit user authorization of the candidate. Only named sources and four generated bundle files can be staged. Unexpected changed paths stop. Remote advancement stops; the final normal non-force push also rejects a later race. A candidate is retained after success/failure; no automatic destructive cleanup occurs.
