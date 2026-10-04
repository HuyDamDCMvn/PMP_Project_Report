import { validSnapshotDate } from "./issues.js";

// Keep original upload identity and TIDP identity separate. All time-series
// consumers follow the same generated link, including temporary aliases.
export function linkedUploadDates(records, families, asOf) {
  const byId = new Map();
  for (const family of families) {
    if (!validSnapshotDate(family.end, asOf)) continue;
    if (!byId.has(family.id) || family.end < byId.get(family.id)) byId.set(family.id, family.end);
  }
  const dates = new Map();
  for (const record of records) {
    if (!record.familyKey || !record.familyId) continue;
    const end = byId.get(record.familyId);
    if (end && (!dates.has(record.familyKey) || end < dates.get(record.familyKey))) dates.set(record.familyKey, end);
  }
  return dates;
}
