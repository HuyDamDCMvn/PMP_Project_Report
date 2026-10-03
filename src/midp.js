// Input contract is source-neutral: future TIDP adapters supply the same fields.
// Explicit team/batch IDs take precedence; System is only the current fallback lot.
export function aggregateMidp(records) {
  const groups = new Map();
  for (const record of records) {
    const workType = record.workType || "Unspecified work type";
    const team = record.teamId || "MEP";
    const batch = record.batchId || record.system || "Unspecified system";
    const key = JSON.stringify([team, workType, batch]);
    if (!groups.has(key)) groups.set(key, { key, team, workType, batch, records: [], weeks: new Map() });
    const group = groups.get(key);
    group.records.push(record);
    for (const entry of record.weeks || []) {
      if (!group.weeks.has(entry.week)) group.weeks.set(entry.week, { ids: new Set(), activities: new Set() });
      const week = group.weeks.get(entry.week);
      week.ids.add(record.id);
      week.activities.add(entry.activity);
    }
  }
  return [...groups.values()].sort((a, b) => a.workType.localeCompare(b.workType) || a.team.localeCompare(b.team) || a.batch.localeCompare(b.batch));
}

// Upload evidence is not approval evidence. Unlinked work types stay unknown.
export function midpWeeklyActual(group, families, asOf, tickets = []) {
  if (group.workType !== "Revise the RFA library") {
    return tickets.filter(ticket => ticket.workType === group.workType &&
      ["resolved", "closed"].includes(ticket.status) &&
      ["Positive", "Re-Assessment"].includes(ticket.active) &&
      ticketSystem(ticket.summary) === group.batch && validEnd(ticket.end, asOf)
    ).map(ticket => ({ ...ticket, title: ticket.summary, system: group.batch, actualWeek: isoWeek(ticket.end).week }));
  }
  const dates = new Map();
  for (const family of families) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(family.end || "")) continue;
    const parsed = new Date(`${family.end}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== family.end) continue;
    if (!dates.has(family.key) || family.end < dates.get(family.key)) dates.set(family.key, family.end);
  }
  const rows = new Map();
  for (const record of group.records) {
    const end = dates.get(record.familyKey);
    if (!end || end > asOf || rows.has(record.familyKey)) continue;
    const date = new Date(`${end}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const year = date.getUTCFullYear();
    const week = Math.ceil(((date - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7);
    if (year !== Number(asOf.slice(0, 4))) continue;
    rows.set(record.familyKey, { ...record, end, actualWeek: week });
  }
  return [...rows.values()];
}

function isoWeek(end) {
  const date = new Date(`${end}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  return { year, week: Math.ceil(((date - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7) };
}

function validEnd(end, asOf) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end || "") || end > asOf) return false;
  const date = new Date(`${end}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === end && isoWeek(end).year === Number(asOf.slice(0, 4));
}

// Only explicit, unambiguous system tokens in source titles; never infer from reporter.
export function ticketSystem(summary) {
  const tokens = String(summary || "").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  const systems = new Set();
  for (const token of tokens) {
    if (["ELT", "MSR"].includes(token)) systems.add("ELT/MSR");
    if (["RLT", "SAN", "HKG"].includes(token)) systems.add(token);
  }
  if (tokens.includes("SPR") && tokens.includes("MED")) systems.add("SPR MED");
  return systems.size === 1 ? [...systems][0] : null;
}
