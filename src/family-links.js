import { validSnapshotDate } from "./issues.js";

// Keep original upload identity and TIDP identity separate. All time-series
// consumers follow the same generated link, including temporary aliases.
export function linkedUploadDates(records, families, asOf, dateField = 'end') {
  const byId = new Map();
  for (const family of families) {
    const date = family[dateField];
    if (!validSnapshotDate(date, asOf)) continue;
    if (!byId.has(family.id) || date < byId.get(family.id)) byId.set(family.id, date);
  }
  const dates = new Map();
  for (const record of records) {
    if (!record.familyKey || !record.familyId) continue;
    const end = byId.get(record.familyId);
    if (end && (!dates.has(record.familyKey) || end < dates.get(record.familyKey))) dates.set(record.familyKey, end);
  }
  return dates;
}
