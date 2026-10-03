import { validSnapshotDate, isoWeekKey, issueMetrics } from "./issues.js";

export function familyOutcome(family) {
  if (family.reworkOutcome === "One_pass") return "One pass";
  if (family.reworkOutcome === "Returned") return "Returned";
  return "Unclassified";
}

export function uploadedFamilyRows(families, asOf) {
  const unique = new Map();
  for (const family of families) {
    if (!validSnapshotDate(family.end, asOf)) continue;
    const key = family.key || family.id;
    if (!unique.has(key)) unique.set(key, family);
  }
  return [...unique.values()];
}

// A many-to-many Family/ticket link must never multiply ticket hours or counts.
export function uploadedFamilyCohort(families, tickets, asOf) {
  const uploaded = uploadedFamilyRows(families, asOf);
  const ids = new Set(uploaded.flatMap(family => family.ticketIds));
  const linked = [...new Map(tickets.filter(ticket => ids.has(ticket.id)).map(ticket => [ticket.id, ticket])).values()];
  return { families: uploaded, tickets: linked };
}

export function familyProductivity(families, tickets, asOf) {
  const cohort = uploadedFamilyCohort(families, tickets, asOf);
  const issues = issueMetrics(cohort.tickets, asOf);
  const weeks = issues.weeks.map(week => ({ ...week, uploaded: cohort.families.filter(family => isoWeekKey(family.end) === week.key) }));
  const onePass = cohort.families.filter(family => familyOutcome(family) === "One pass");
  return { ...cohort, issues, weeks, onePass,
    onePassRate: cohort.families.length ? onePass.length / cohort.families.length : null };
}
