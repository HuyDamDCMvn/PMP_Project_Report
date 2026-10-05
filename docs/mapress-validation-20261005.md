# Mapress source correction — 2026-10-05

Baseline: 67b61f61dc1493a8cfda5ae1e7caa144df4235a5. User approved excluding the 72176 alias and subsequently authorized all established source/metadata corrections. No replacement carbon-steel equivalence is inferred.

Changes: Family Mapress Weigh Score Sum 4 → 2; source note now one ticket / weight 2. Family Meta Families 2043 → 2044 and Multi_remaining 1 → 0. Equivalence Summary now reflects its actual 2001 applied rows and Decision counts (the removed row was proposed). Historical sheets and original Generated timestamps preserved.

Final equivalence Git blob: 0b9ca178dc18a838e9d54613001269c0e4797658. Approval date and policy in JSON describe 2026-10-05 scope; proposed/temporary source decisions remain unchanged. This authorization is not independent physical-model verification.

Checks: data:build passed; 13 Python tests, 46 JavaScript tests, lint and Vite build passed. Source tests verify 2044 full rows, 2002 project rows, total weight 4004, metadata and negative weight/count/fanout/equivalence-ticket fixtures. Hash, duplicate endpoint and exact-upload conflict guards retained. Python tests added to CI.

Expected local population: 2002 uploaded families, 1500 One pass, 501 Returned, 1 Unclassified; 15953.25 cohort hours. Applied TIDP matches remain 2001 and unmatched 294 under the explicitly approved exclusion. Snapshot remains 2026-09-30.

Open business evidence: D1 physical upload at snapshot, D2 semantic carbon-steel mapping and D3 individual review evidence for retained error flags are not independently established. FKMBlue stays Unclassified. No errors are copied or cleared. D4 temporary policy remains the prior approval with explicit 72176 exclusion. D6 publication, production U02 and release-run verification are pending explicit authorization; no remote changes made.
