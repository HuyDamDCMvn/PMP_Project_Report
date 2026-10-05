import { validSnapshotDate, isoWeekKey, issueMetrics } from "./issues.js";
import { forecastCatchUp } from "./domain.js";
import { linkedUploadDates } from './family-links.js';

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

export function familyProductivity(families, tickets, asOf, { startWeek, planRows = [] } = {}) {
  const cohort = uploadedFamilyCohort(families, tickets, asOf);
  const weekCount = startWeek == null ? 8 : Math.max(1, Number(isoWeekKey(asOf).slice(-2)) - startWeek + 1);
  const issues = issueMetrics(cohort.tickets, asOf, weekCount);
  const weeks = issues.weeks.map(week => ({ ...week, uploaded: cohort.families.filter(family => isoWeekKey(family.end) === week.key) }));
  const onePass = cohort.families.filter(family => familyOutcome(family) === "One pass");
  const reportingWeek = Number(isoWeekKey(asOf).slice(-2));
  const partial = new Date(`${asOf}T00:00:00Z`).getUTCDay() !== 0;
  const completeWeeks = partial ? weeks.slice(0, -1) : weeks;
  const weeklyRate = completeWeeks.slice(-4).reduce((sum, week) => sum + week.uploaded.length, 0) / 4;
  const dates = linkedUploadDates(planRows, families, asOf);
  const target = new Set(planRows.filter(r=>r.familyKey && r.workType==='Revise the RFA library').map(r=>r.familyKey)).size;
  const planRate = completeWeeks.slice(-4).reduce((sum,w)=>sum+[...dates.values()].filter(d=>isoWeekKey(d)===w.key).length,0)/4;
  const projection = forecastCatchUp(dates.size, target, planRate, reportingWeek);
  const forecastWeeks = projection.points.filter(point => point.week > reportingWeek && point.week <= 43).map((point, i) => ({
    week: point.week, value: point.value - (i ? projection.points.find(p => p.week === point.week - 1).value : dates.size),
  }));
  const firstUpload = cohort.families.map(family => family.end).sort()[0] || null;
  const calendarDays = firstUpload ? Math.floor((Date.parse(asOf) - Date.parse(firstUpload)) / 86400000) + 1 : 0;
  return { ...cohort, issues, weeks, onePass,
    firstUpload, calendarDays, weeklyRate, forecastWeeks, tidpUploadScenario: { ...projection, actual: dates.size, target, weeklyRate: planRate },
    uploadsPerDay: calendarDays ? cohort.families.length / calendarDays : null,
    hoursPerFamily: cohort.families.length && issues.hoursRows.length ? issues.hours / cohort.families.length : null,
    onePassRate: cohort.families.length ? onePass.length / cohort.families.length : null };
}

// Preserve the Overview population; ticket numbers are evidence, not additional rows.
export function tidpUploadDetails(deliverables, familyById, value, selectedFamilyIds) {
  const uploaded = value === "Uploaded";
  const rows = [...new Map(deliverables.filter(r => r.familyKey && r.workType === "Revise the RFA library").map(r => [r.familyKey, r])).values()]
    .filter(r => Boolean(r.familyId && (!selectedFamilyIds || selectedFamilyIds.has(r.familyId))) === uploaded);
  const columns = ["id", "title", "system", "owner", "workType"];
  if (!uploaded) return { rows, columns };
  columns.splice(4, 0, "ticketNumber");
  return { columns, rows: rows.map(row => ({ ...row, ticketNumber: [...new Set(familyById.get(row.familyId)?.ticketIds || [])]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })).join(", ") || null })) };
}
