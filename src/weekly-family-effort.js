import { familyProductivity, uploadedFamilyCohort } from "./family-outcomes.js";
import { renderWeeklySeries } from "./weekly-hours.js";

export function weeklyFamilyEffort(families, tickets, asOf) {
  const m = familyProductivity(families, tickets, asOf, { startWeek: 20 });
  return m.weeks.map(week => {
    const cohort = uploadedFamilyCohort(week.uploaded, tickets, asOf);
    const known = cohort.tickets.map(t => ({ ...t, actualHours: Number.isFinite(t.actualHoursSource) ? Math.floor(t.actualHoursSource * 4 + 0.5) / 4 : t.actualHours })).filter(t => Number.isFinite(t.actualHours) && t.actualHours >= 0);
    const hours = known.reduce((sum, t) => sum + t.actualHours, 0);
    return { key: week.key, families: cohort.families, tickets: known, linkedTickets: cohort.tickets,
      missing: cohort.tickets.length - known.length,
      hours, value: cohort.families.length && known.length ? hours / cohort.families.length : null };
  });
}

export function weeklyRoleEffort(weeks, dataset, role) {
  const lookup = new Map((dataset?.tickets || []).map(t => [t.ticketId, t]));
  return weeks.map(w => {
    if (!w.families?.length) return { key: w.key, value: null, rows: [] };
    const ids = new Set((w.linkedTickets || w.tickets || []).map(t => t.id));
    const incomplete = [...ids].some(id => !lookup.get(id)?.complete);
    const rows = [...ids].flatMap(id => (lookup.get(id)?.people || []).filter(p => p.role === role).map(p => ({ id, ...p })));
    const count = w.families.length;
    const hours = rows.reduce((sum, p) => sum + p.hours, 0);
    return { key: w.key, value: !incomplete && count ? hours / count : null, hours, count, rows, incomplete };
  });
}

export function renderWeeklyFamilyEffort({ families, tickets, asOf, panel, register, filters, fmt, axisStep = 5, roleHours }) {
  const title = "Average recorded hours per Family by week";
  const averageFmt = value => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const actualWeeks = weeklyFamilyEffort(families, tickets, asOf);
  const currentWeek = actualWeeks.at(-1)?.key;
  const byWeek = new Map(actualWeeks.map(w => [w.key, w]));
  const weeks = Array.from({ length: 24 }, (_, i) => {
    const key = `2026-CW${i + 20}`;
    return byWeek.get(key) || { key, value: null, future: true };
  });
  const overlays = roleHours ? [
    { name: 'MEP Modeler', className: 'mep-role' },
    { name: 'Digital Coordinator', className: 'dc-role' },
  ].map(role => ({ ...role, weeks: weeklyRoleEffort(weeks, roleHours, role.name), mark: w => {
    const id = `role-effort:${role.className}:${w.key}`;
    const byId = new Map(tickets.map(t => [t.id, t]));
    register(id, { title: `${role.name} · ${w.key} · ${fmt(w.hours)} h / ${w.count} Families`,
      rows: w.rows.map(p => ({...byId.get(p.id), actualHours: p.hours, summary: `${byId.get(p.id)?.summary || p.id} · Recorded by ${p.name || p.user} (${p.user})`})),
      columns: ['id', 'summary', 'actualHours'], source: roleHours.meta.source });
    return `<button class="role-mark" data-issue-detail="${id}" aria-label="${role.name} ${w.key}: ${averageFmt(w.value)} hours per Family" title="${role.name}: ${averageFmt(w.value)} h / Family">${averageFmt(w.value)}</button>`;
  }})) : [];
  const roleLegend = roleHours ? '<div class="progress-legend role-legend"><span class="actual">All linked ticket hours</span><span class="mep-role">MEP Modeler</span><span class="dc-role">Digital Coordinator</span></div>' : '';
  const warning = roleHours ? (overlays.some(s => s.weeks.some(w => w.incomplete)) ? '<p class="cell-muted" role="status">Role averages have gaps where time attribution is incomplete.</p>' : '') : '<p class="cell-muted" role="status">Role time attribution is unavailable.</p>';
const body = roleLegend + warning + renderWeeklySeries({ weeks, overlays, title, showMonths: true, currentWeek, weekSpacing: 70, axis: { id: "effort-axis-step", key: "effortAxisStep", label: "Y-axis step (hours / Family)", min: 0.25, max: 100, increment: 0.25, value: axisStep }, axisLabel: "Recorded hours / Family", legend: "", fmt: averageFmt,
    label: w => {
      if (w.value === null) return w.future ? "" : '<span class="cell-muted" title="No uploaded Families or no known linked hours">—</span>';
      const id = `family-effort:${w.key}`;
      register(id, { title: `${title} · ${w.key} · ${fmt(w.hours)} h / ${w.families.length} Families`, rows: w.tickets,
        columns: ["id", "summary", "handler", "actualHours"], source: "Matrix recorded ticket totals linked to Families uploaded in this ISO week; ticket totals counted once within each week." });
      return `<button class="issue-count" data-issue-detail="${id}" aria-label="Open ${w.key}: ${averageFmt(w.value)} hours per Family">${averageFmt(w.value)}</button>`;
    },
    weekLabel: w => `<span class="issue-week-label">${w.key.slice(-2)}</span>`,
  });
return panel(title, "", `${weeks.some(w => w.value !== null) ? body : '<div class="empty">No uploaded Families with known linked hours match the current filters.</div>'}<details class="chart-source"><summary>Chart purpose and parameters</summary><p>All three lines divide by the same Weekly Family uploads count. Role hours use actual recorder history, rounded to the nearest 0.25 h per ticket/person; exact halfway cases round toward the larger value. Blue uses original Matrix ticket hours rounded to the nearest 0.25 h. Source reconciliation and separate rounding can still cause differences. The month row uses the Thursday of each ISO week. Purpose: compare recorded effort per uploaded Family between weeks, not individual performance. The horizontal axis shows ISO weeks CW20–CW43; the vertical axis shows hours per Family. Blue marks are measured averages; the amber dashed line marks the snapshot week. Y-axis step adjusts grid spacing only. Each blue value is known total recorded hours of unique linked tickets divided by the unique Families uploaded in that ISO week. For this chart only, ticket hours are rounded to the nearest 0.25 h before aggregation; other KPIs retain their existing policy; the resulting average is displayed to two decimals, not rounded to a quarter hour. This is recorded effort per Family, not elapsed days or project hours spent during that week divided by uploads. Work can have occurred in earlier weeks. A shared ticket is counted once within each upload week and can appear in multiple weeks, so weekly numerators must not be added into a project total. Missing hours are excluded from the numerator; all uploaded Families remain in the denominator. A dash and a line gap mean no calculable average, not zero hours. CW40 is partial. The axis extends through CW43 to align with Weekly Family uploads; future averages remain blank because no recorded hours are available. Click a value for linked tickets or a week label to filter related records.</p></details>`, "issues-panel");
}
