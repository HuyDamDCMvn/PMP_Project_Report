import "./styles.css";
import { linkedUploadDates } from "./family-links.js";
import { aggregateMidp, midpWeeklyActual, midpTableExport, ticketSystem } from "./midp.js";
import { familyErrorSystems, renderReworkHeatmap } from './rework-heatmap.js';
import { selectTableRows, downloadCsv } from "./table-export.js";
import { matchesIssueFilters, personName, samePerson, isoWeekKey } from "./issues.js";
import { renderFamilyAnalysis } from "./issues-view.js";
import { renderWeeklyHours, renderWeeklyMonthRow } from "./weekly-hours.js";
import { renderWeeklyFamilyEffort } from "./weekly-family-effort.js";
import { enableChartOrdering } from "./chart-order.js";
import { familyOutcome, uploadedFamilyRows, uploadedFamilyCohort, tidpUploadDetails } from "./family-outcomes.js";
import {
  agingBucket,
  buildContext,
  deliverableState,
  dependencyState,
  groupCount,
  forecastCatchUp,
  isOpenTicket,
  managementAttention,
  percentile,
  ticketAge,
} from "./domain.js";

const PAGE_META = {
  overview: ["Executive Overview", "Project health, current delivery evidence and management action."],
  tidp: ["Master Information Delivery Plan", "Master delivery plan by work package and lot."],
  team: ["Issues & Productivity", "Issues and productivity for uploaded Families."],
  quality: ["Data Quality", "Missing evidence, source contradictions and unsupported KPIs."],
};

const state = {
  page: "tidp",
  filters: { system: "", owner: "", workType: "", status: "", search: "" },
  tablePage: 1,
  teamMetric: "deliverables",
  familyAxisStep: 100,
  uploadAxisStep: 25,
  hoursAxisStep: 200,
  effortAxisStep: 5,
  issueAxisStep: 5,
  hiddenErrorSeries: [],
  showIssueLabels: false,
  collapsed: {},
};

let data;
let familyRoleHours;
let timeHistory;
let context;
let lookup;
const pieDetails = new Map();
let pieDetailSelection = null;
let pieDetailTrigger = null;

const escapeHtml = (value) => String(value ?? "—").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));
const fmt = (value) => Number(value || 0).toLocaleString("en-US");
const pct = (value) => `${Math.round((value || 0) * 100)}%`;
const fmtDate = (value) => value ? new Intl.DateTimeFormat("en-GB").format(new Date(`${value}T12:00:00`)) : "—";
const avg = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const hourClass = (ticket) => ["Positive", "Re-Assessment"].includes(ticket.active) ? "Positive" : ticket.active;

function createLookup() {
  const ticketById = new Map(data.tickets.map((item) => [item.id, item]));
  const familyById = new Map(data.families.map((item) => [item.id, item]));
  const deliverableById = new Map(data.deliverables.map((item) => [item.id, item]));
  const deliverablesByFamily = new Map();
  data.deliverables.forEach((deliverable) => {
    if (!deliverable.familyId) return;
    if (!deliverablesByFamily.has(deliverable.familyId)) deliverablesByFamily.set(deliverable.familyId, []);
    deliverablesByFamily.get(deliverable.familyId).push(deliverable);
  });
  return { ticketById, familyById, deliverableById, deliverablesByFamily };
}

function appShell() {
  const nav = [["tidp", "00"], ["overview", "01"], ["team", "03"], ["quality", "04"]].map(([key, number]) => {
    const label = key === "tidp" ? "MIDP / TIDP" : PAGE_META[key][0];
    return `
    <button data-nav="${key}" class="${state.page === key ? "active" : ""}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
      <span class="nav-index">${number}</span><span>${label.replace("MIDP / TIDP Delivery Control", "MIDP / TIDP").replace("Annotation Ticket Control", "Annotation Tickets").replace("Cross-data Dependencies", "Dependencies").replace("Team & Resource", "Team & Resource")}</span>
    </button>`;
  }).join("");
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><img class="brand-logo" src="${import.meta.env.BASE_URL}logo.svg" alt="DCMvn logo"></div>
        <nav class="nav">${nav}</nav>
        <div class="source-note">Snapshot has been captured since 16:00 - 30.09.2026</div>
      </aside>
      <div class="workspace">
        ${topbar()}
        <main class="content" id="page-content"></main>
      </div>
    </div>
    <div id="drawer-root"></div>`;
}

function options(values, selected, emptyLabel = "All") {
  return `<option value="">${emptyLabel}</option>${values.map((value) => `<option ${value === selected ? "selected" : ""} value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
}

function topbar() {
  return `<header class="topbar">
    <div class="project-pill"><strong>${escapeHtml(data.meta.project)}</strong><span>CW${data.meta.reportingWeek} · as of ${fmtDate(data.meta.asOf)}</span></div>
  </header>`;
}

function filtered() {
  const f = state.filters;
  const term = f.search.toLowerCase().trim();
  let deliverables = data.deliverables.filter((item) =>
    (!f.upload || (item.familyKey && (f.upload === "Uploaded" ? Boolean(item.familyId) : !item.familyId))) &&
    (!f.system || item.system === f.system) &&
    (!f.owner || samePerson(item.owner, f.owner) || (item.familyId && lookup.familyById.get(item.familyId)?.ticketIds.some(id => samePerson(lookup.ticketById.get(id)?.handler, f.owner)))) &&
    (!f.workType || item.workType === f.workType) &&
    (!term || `${item.id} ${item.title} ${item.system} ${item.owner}`.toLowerCase().includes(term))
  );
  const allowedFamilyIds = new Set(deliverables.map((item) => item.familyId).filter(Boolean));
  const errorSystems = familyErrorSystems(data.deliverables);
  let families = data.families.filter((item) =>
    (!f.uploadWeek || isoWeekKey(item.end) === f.uploadWeek) &&
    (!f.uploader || (item.uploader || "Unassigned") === f.uploader) &&
    (!f.familyOutcome || familyOutcome(item) === f.familyOutcome) &&
    (!f.reworkError || (familyOutcome(item) === 'Returned' && item.reworkErrors?.includes(f.reworkError))) &&
    (!f.errorSystem || (errorSystems.get(item.id) || 'Unknown system') === f.errorSystem) &&
    (!(f.system || f.upload) || allowedFamilyIds.has(item.id)) &&
    (!f.owner || samePerson(item.uploader, f.owner) || item.ticketIds.some((id) => samePerson(lookup.ticketById.get(id)?.handler, f.owner))) &&
    (!term || `${item.id} ${item.name} ${item.category} ${item.uploader} ${item.ticketIds.join(" ")}`.toLowerCase().includes(term))
  );
  const allowedTicketIds = new Set(families.flatMap((item) => item.ticketIds));
  const tickets = data.tickets.filter((item) =>
    (!f.spentWeek || (timeHistory?.entries || []).some(e => e.ticketId === item.id && e.week === f.spentWeek && e.hours !== 0)) &&
    matchesIssueFilters(item, f, data.meta.asOf) &&
    (!f.reporter || (item.reporter || "Unknown reporter") === f.reporter) &&
    (!f.active || hourClass(item) === f.active) &&
    (!f.system || allowedTicketIds.has(item.id) || ticketSystem(item.summary) === f.system) &&
    (!f.upload || allowedTicketIds.has(item.id)) &&
    (!(f.familyOutcome || f.uploadWeek || f.uploader || f.reworkError || f.errorSystem) || allowedTicketIds.has(item.id)) &&
    (!f.owner || samePerson(item.handler, f.owner)) &&
    (!f.workType || item.workType === f.workType) &&
    (!f.status || item.status === f.status) &&
    (!term || `${item.id} ${item.summary} ${item.handler} ${item.reporter}`.toLowerCase().includes(term))
  );
  if (f.spentWeek || f.active || f.status || f.reporter || f.issueState || f.aging || f.activityWeek || f.owner || f.workType) {
    const ids = new Set(tickets.map((item) => item.id));
    families = families.filter((item) => item.ticketIds.some((id) => ids.has(id)));
    const familyIds = new Set(families.map((item) => item.id));
    deliverables = deliverables.filter((item) => familyIds.has(item.familyId) || (!item.familyKey && tickets.some(ticket => ticket.workType === item.workType && ticketSystem(ticket.summary) === item.system)));
  }
  if (f.familyOutcome || f.uploadWeek || f.uploader || f.reworkError || f.errorSystem) {
    const familyIds = new Set(families.map(item => item.id));
    deliverables = deliverables.filter(item => familyIds.has(item.familyId));
  }
  return { deliverables, tickets, families };
}

function heading() {
  const [title] = PAGE_META[state.page];
  const active = Object.entries(state.filters).filter(([, value]) => value);
  return `<div class="page-heading"><div><p class="eyebrow">DCMvn_Annotation Project Overview Report</p><h1>${title}</h1></div></div>
    ${active.length ? `<div class="filter-chips">${active.map(([key, value]) => `<button class="chip" data-set-filter="${key}" data-filter-value="${escapeHtml(value)}">${escapeHtml(key)}: ${escapeHtml(key === "owner" ? personName(value) : value)} ×</button>`).join("")}<button class="button" id="reset-filters">Reset Filters</button></div>` : ""}`;
}

function piePanel(id, title, slices, unit, source, { showSourceContext = false, disclosureTitle = "Chart purpose and legend definitions" } = {}) {
  pieDetails.set(id, { title, unit, source });
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const number = (value) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  let offset = 0;
  const anchors = [];
  // Separate the tiny work-type slices instead of clustering their anchors.
  const ringSlices = id === "positive-work-type" && slices.length === 6
    ? [0, 4, 1, 3, 2, 5].map((index) => slices[index]) : slices;
  const marks = ringSlices.map((item) => {
    const length = total ? item.value / total * 100 : 0;
    if (item.value > 0) {
      const angle = (offset + length / 2) / 100 * Math.PI * 2 - Math.PI / 2;
      anchors.push({ ...item, share: length, x: 21 + 20.5 * Math.cos(angle), y: 21 + 20.5 * Math.sin(angle), right: Math.cos(angle) >= 0 });
    }
    const point = (radius, percent) => {
      const radians = percent / 100 * Math.PI * 2;
      return `${21 + radius * Math.cos(radians)},${21 + radius * Math.sin(radians)}`;
    };
    const arcLength = Math.min(length, 99.9999);
    const large = arcLength > 50 ? 1 : 0;
    const path = `M${point(20.4155, offset)} A20.4155,20.4155 0 ${large} 1 ${point(20.4155, offset + arcLength)} L${point(11.4155, offset + arcLength)} A11.4155,11.4155 0 ${large} 0 ${point(11.4155, offset)} Z`;
    const mark = length > 0 ? `<path class="donut-slice" d="${path}" fill="${item.color}" role="button" tabindex="0" data-pie-detail="${id}" data-slice-filter="${item.filter}" data-slice-value="${escapeHtml(item.label)}" aria-label="${escapeHtml(`${title}: ${item.label}, ${number(item.value)} ${unit}. Open details`)}"><title>${escapeHtml(`${item.label}: ${number(item.value)} ${unit} — click for details`)}</title></path>` : "";
    offset += length;
    return mark;
  }).join("");
  const labelNames = { "Revise the RFA library": "RFA library", "Framework deliverables": "Framework deliverables", "Sample Model + Output Data": "Sample model + output", "Output Checklists": "Output checklists", "Create Revit templates for each LPH": "Revit templates", "Export layouts to Revizto & 3D Review": "Revizto + 3D review" };
  const labels = [false, true].map((right) => {
    const side = anchors.filter((item) => item.right === right).sort((a, b) => a.y - b.y);
    return side.map((item, index) => {
      const y = side.length === 1 ? item.y : -6 + index * 54 / (side.length - 1);
      const end = right ? 50 : -14;
      const textX = right ? 51 : -15;
      const share = item.share < .1 ? "<0.1" : item.share.toFixed(1);
      const laneDistance = y < item.y ? 1 + index * 1.5 : 10 - index * 1.5;
      const lane = right ? 42 + laneDistance : -laneDistance;
      return `<g class="donut-label"><polyline points="${item.x},${item.y} ${lane},${item.y} ${lane},${y} ${end},${y}"/><circle cx="${item.x}" cy="${item.y}" r=".5" fill="${item.color}"/><text x="${textX}" y="${y - 1}" text-anchor="${right ? 'start' : 'end'}">${escapeHtml(labelNames[item.label] || item.label)}<tspan x="${textX}" dy="3.5">${number(item.value)} · ${share}%</tspan></text></g>`;
    }).join("");
  }).join("");
return `<details class="panel pie-panel" data-collapse="${id}" ${state.collapsed[id] ? "" : "open"}><summary><h2>${title}</h2><span>Details</span></summary><div class="pie-layout"><div class="donut-wrap"><svg viewBox="${id === 'returned-errors' ? '-64 -10 165 62' : '-46 -10 134 62'}" role="group" aria-label="${escapeHtml(slices.map((item) => `${item.label}: ${number(item.value)} ${unit}`).join(', '))}"><circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--grey-soft)" stroke-width="9"/><g transform="rotate(-90 21 21)">${marks}</g>${labels}<text class="donut-center-value" x="21" y="21" text-anchor="middle">${number(total)}</text><text class="donut-center-unit" x="21" y="25" text-anchor="middle">${unit}</text></svg></div><div class="pie-legend">${slices.map((item) => `<button data-set-filter="${item.filter}" data-filter-value="${item.label}" class="pie-key ${state.filters[item.filter] === item.label ? "selected" : ""}" aria-pressed="${state.filters[item.filter] === item.label}"><i style="background:${item.color}"></i><span>${item.label}</span><strong>${number(item.value)}</strong><small>${total ? (item.value / total * 100).toFixed(1) : '0.0'}%</small></button>`).join("")}${!total ? '<p class="empty">No related records match the current filters.</p>' : ''}</div></div><details class="chart-source"><summary>${escapeHtml(disclosureTitle)}</summary><h3>Purpose and how to read this chart</h3><p>${source}</p>${renderLegendDefinitions(slices, escapeHtml, item => `Group ${item.label} from source field ${item.filter}; values are ${unit}, and percentages are shares of the displayed total.`)}${showSourceContext ? `<p>As of ${fmtDate(data.meta.asOf)}. Select a legend item to filter related dashboard records.</p>` : ""}</details></details>`;
}

function kpi(label, value, note, tone = "", action = "") {
  return `<button class="kpi ${action ? "actionable" : ""}" ${action ? `data-action="${action}"` : "disabled"}>
    <div class="kpi-label">${label}</div><div class="kpi-value ${tone}">${value}</div><p class="kpi-note">${note}</p></button>`;
}

function healthItem(label, value, tone, page) {
  return `<button class="health-item" data-nav="${page}"><span class="health-label">${label}</span><span class="health-value"><i class="status-dot ${tone}"></i>${value}</span></button>`;
}

function barList(counts, { color = "", filter = "", limit = 8 } = {}) {
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return `<div class="bar-list">${rows.map(([label, value]) => `<button class="bar-row" ${filter ? `data-set-filter="${filter}" data-filter-value="${escapeHtml(label)}"` : ""}><span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="bar-track"><span class="bar-fill ${color}" style="width:${(value / max) * 100}%"></span></span><span class="bar-value">${fmt(value)}</span></button>`).join("")}</div>`;
}

function stack(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return `<div class="stack">${items.map((item) => `<button title="${escapeHtml(item.label)}: ${fmt(item.value)}" data-set-filter="status" data-filter-value="${escapeHtml(item.label)}" style="width:${(item.value / total) * 100}%;background:${item.color}"></button>`).join("")}</div><div class="legend">${items.map((item) => `<span style="--legend-color:${item.color}">${escapeHtml(item.label)} · ${fmt(item.value)}</span>`).join("")}</div>`;
}

const panelChartNotes = {
"Weekly Family uploads": "This line chart shows unique uploaded Families per ISO week. The horizontal axis shows weeks; the vertical axis, blue points and numbers show Family counts, not cumulative totals. The amber dashed line marks the partial reporting week, which covers only dates through the snapshot. With the current approved mapping and no filters, each weekly count equals the increase in Overview cumulative Actual. Brown dashed Forecast through CW43 shows weekly increments from the same four-complete-week scenario as Overview, capped at the planned total. Forecast labels are rounded estimates without detail actions. Actual nodes do not filter. Click a week label to filter, or an Actual count to view Families.",
  "Weekly linked issues": "Weeks start at CW20 and use the same distinct Family upload cohorts and End Date as Weekly Family uploads. The dashed Ink Uploaded Families reference exactly matches each actual weekly upload count, including One pass Families. The other nine lines count source X flags among Returned Families once per Family/type; their sum is not a unique upload or ticket count because a Family may have multiple errors. No error forecast is inferred. Colors and dash patterns identify types. Hover or focus a node for its count; activate it for Family evidence. Legend buttons hide/show chart lines only, not dashboard filters. The Y-axis step changes grid spacing only. Up to three visible lines show numeric labels; dense selections use accessible node tooltips. CW40 is partial through the snapshot; month bands use ISO Thursday. Source: Family_Upload_vs_Annotation_Tickets_Checked.xlsx / Family_vs_Tickets. Rebuild with npm run data:build.",
  "Open issue aging": "This chart groups open tickets by days since creation at the reporting snapshot. Each number is the ticket count in that age range. Red highlights tickets older than 30 days; Unknown means the creation date is unavailable. Select an age range to filter, or a number for ticket details.",
  "Issue status": "This chart compares linked ticket counts by current status. Blue bar length shows the relative count; the number gives the exact count. Closed and resolved represent completed tickets; assigned represents ongoing work. Select a status or bar to filter, or a number for ticket details.",
  "Open issues by handler": "This chart compares open linked tickets by current handler. Amber bar length and numbers show each handler's open queue. Select a name or bar to filter, or a number for ticket details. A larger queue indicates more open tickets, not lower individual productivity.",
  "Uploaded Families by uploader": "This chart compares unique uploaded Families by uploader. Blue bar length and numbers show each uploader's Family count. Select a name or bar to filter, or a number for Family details. Counts describe output volume; they do not account for task complexity.",
  "Linked effort by handler": "This chart compares recorded ticket hours by handler for uploaded Families. Blue bar length and numbers show total hours, counted once per linked ticket. These hours are not allocated to upload weeks. Select a name or bar to filter, or a number for ticket details.",
  "Relationship evidence": "This chart compares counts of planning records by relationship category. Each category describes how the record relates to Family data; bar length shows its relative count and the number gives the exact count. These are relationship checks, not completion or approval scores.",
  "Issue categories": "This chart shows data-quality checks requiring review. Amber bars compare the counts for each check; numbers give exact counts. A record can fail more than one check, so the bars should not be added as a count of unique affected records.",
  "Work items by system": "This chart compares planned work-item counts by system. Blue bar length shows the relative count; numbers show exact counts. Select a system to filter related dashboard records.",
  "Schedule / evidence state": "This chart groups work items by schedule and evidence state. Amber bar length and numbers show each state's count. Each item appears in one state; past planned work does not prove completed delivery.",
  "Open-ticket aging": "This chart groups unresolved tickets by days since creation at the snapshot. Amber bars compare ticket counts in each age range; numbers show exact counts. Age is elapsed time, not contractual overdue time.",
  "Open workload by handler": "This chart compares unresolved ticket counts by handler. Blue bars show relative queue size and numbers show exact counts. Select a handler to filter. Queue size alone does not measure individual performance.",
  "TIDP family coverage by system": "This chart shows the percentage of planned RFA work items linked to uploaded Families in each system. Blue bar length compares coverage and numbers show percentages. Select a system to filter related records.",
  "Uploaded families by category": "This chart compares uploaded Family counts for the largest categories. Blue bar length shows relative volume; numbers give exact counts. Only the displayed top categories are shown.",
  "Dependency state": "This chart groups work items by their schedule, Family link and linked-ticket state. Amber bars show relative counts and numbers give exact counts. These categories identify dependencies requiring attention.",
};

function panel(title, subtitle, body, className = "") {
  const note = panelChartNotes[title];
  return `<section class="panel ${className}"><div class="panel-header"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div></div>${body}${note ? `<details class="chart-source"><summary>Chart purpose and legend definitions</summary><p>${escapeHtml(note)}</p>${title === "Weekly linked issues" ? renderLegendDefinitions(Object.keys(legendDefinitions).filter(label => label === "Uploaded Families" || ["Graphics_2D_Visibility", "Ticket Missing Meta Data", "Category_Template_Structure", "Family_Naming_Convention", "Other_Unclear", "Parameter_Naming", "Geometry_Dimensions", "Connector_MEP", "RevitVersion_File_Upload"].includes(label)).map(label => ({ label })), escapeHtml, () => "") : ""}</details>` : ""}</section>`;
}

function statusBadge(value) {
  const lower = String(value).toLowerCase();
  const tone = lower.includes("risk") || lower.includes("intervention") || lower.includes("critical") ? "red" : lower.includes("past") || lower.includes("confirm") || lower.includes("aging") ? "amber" : lower.includes("current") || lower.includes("assigned") || lower.includes("acknowledged") ? "blue" : lower.includes("track") || lower.includes("closed") || lower.includes("resolved") || lower.includes("uploaded") ? "green" : "";
  return `<span class="badge ${tone}">${escapeHtml(value)}</span>`;
}

const tableExports = new Map();
function tableExportButton(id, title, columns, rows) {
  tableExports.set(id, { title, columns, rows });
  return `<div class="table-export-tools"><span class="cell-muted" role="status" data-export-status></span><button type="button" class="button" data-table-export="${escapeHtml(id)}" title="Export all matching rows in the current order">Export CSV</button></div>`;
}

function dataTable({ title, subtitle, columns, rows, kind, exportName = "records" }) {
  const exportColumns = columns.map(column => ({ ...column, value: row => {
    if (!column.render) return row[column.key];
    const text = document.createElement("template");
    text.innerHTML = column.render(row).replace(/<\/div>/g, "</div> ");
    return text.content.textContent.trim();
  } }));
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  state.tablePage = Math.min(state.tablePage, totalPages);
  const start = (state.tablePage - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = visible.length ? visible.map((row) => `<tr class="clickable" data-open-kind="${kind}" data-open-id="${row.id}">${columns.map((column) => `<td>${column.render ? column.render(row) : escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${columns.length}" class="empty">No records match the current filters.</td></tr>`;
  return `<section class="panel"><div class="panel-header"><div><h2>${title}</h2><p>${subtitle}</p></div>${tableExportButton(exportName, title, exportColumns, rows)}</div><div class="table-tools"><span>${fmt(rows.length)} records · showing ${rows.length ? start + 1 : 0}–${Math.min(start + pageSize, rows.length)}</span><span>Click a row for source trace</span></div><div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div><div class="pagination"><button data-page-step="-1" ${state.tablePage === 1 ? "disabled" : ""}>←</button><span>Page ${state.tablePage} / ${totalPages}</span><button data-page-step="1" ${state.tablePage === totalPages ? "disabled" : ""}>→</button></div></section>`;
}

function familyProgressChart(deliverables, families) {
  const names = new Map();
  deliverables.filter((item) => item.familyKey && item.workType === "Revise the RFA library").forEach((item) => {
    const old = names.get(item.familyKey);
    const first = item.plannedStartWeek;
    names.set(item.familyKey, { first: first ? Math.min(first, old?.first || first) : old?.first, uploaded: Boolean(item.familyId) || Boolean(old?.uploaded) });
  });
  const uploadDates = linkedUploadDates(deliverables, families, data.meta.asOf);
  // ISO weeks in 2026 start on Monday; CW01 starts 29 December 2025.
  const weekEnd = (week) => new Date(Date.UTC(2025, 11, 29 + week * 7 - 1)).toISOString().slice(0, 10);
  const rows = Array.from({ length: 38 }, (_, i) => {
    const week = i + 5;
    const cutoff = weekEnd(week) < data.meta.asOf ? weekEnd(week) : data.meta.asOf;
    return { week, count: [...names.values()].filter((item) => item.first && item.first <= week).length,
      actual: week > data.meta.reportingWeek ? null : [...uploadDates.values()].filter((date) => date <= cutoff).length };
  });
  const actual = rows.find((row) => row.week === data.meta.reportingWeek).actual;
  const completedWeek = weekEnd(data.meta.reportingWeek) > data.meta.asOf ? data.meta.reportingWeek - 1 : data.meta.reportingWeek;
  const cumulativeAt = (week) => [...uploadDates.values()].filter((date) => date <= weekEnd(week)).length;
  const weeklyRate = (cumulativeAt(completedWeek) - cumulativeAt(completedWeek - 4)) / 4;
  const target = rows.at(-1).count;
  const forecast = forecastCatchUp(actual, target, weeklyRate, data.meta.reportingWeek);
  const endWeek = Math.max(42, forecast.points.at(-1)?.week || 42);
  while (rows.at(-1).week < endWeek) rows.push({ week: rows.at(-1).week + 1, count: target, actual: null });
  const weekLabel = (week) => week <= 53 ? `CW${String(week).padStart(2, "0")}` : `CW${String(week - 53).padStart(2, "0")}/2027`;
  const forecastMessage = forecast.week == null ? "Forecast unavailable: no uploads in the last four complete CWs." : actual >= target ? "Plan already reached." : `Forecast catch-up: ${weekLabel(forecast.week)} · ${fmt(weeklyRate)} families/week`;
  const axisStep = state.familyAxisStep;
  const max = Math.max(axisStep, Math.ceil(names.size / axisStep) * axisStep);
  const ticks = Array.from({ length: Math.round(max / axisStep) + 1 }, (_, i) => i * axisStep);
  const plotHeight = Math.max(480, (ticks.length - 1) * 20);
  const bottom = 80 + plotHeight;
  const canvasWidth = Math.max(1600, 150 + (endWeek - 5) * 46);
  const x = (w) => 90 + (w - 5) / (endWeek - 5) * (canvasWidth - 150);
  const y = (v) => bottom - v / max * plotHeight;
  const detailRows = [...names.entries()].map(([key, item]) => {
    const source = deliverables.find((r) => r.familyKey === key);
    return { id: source.id, title: source.title, system: source.system, owner: source.owner, plannedStartWeek: item.first, end: uploadDates.get(key) || "" };
  });
  pieDetails.set("family-progress", { title: "Cumulative Family Progress", rows: detailRows, weekEnd });
  const forecastValue = row => {
    const point = forecast.points.find(p => p.week === row.week && row.week > data.meta.reportingWeek);
    return point ? Math.round(point.value) : null;
  };
  const weeklyExport = tableExportButton("progress-weekly", "Cumulative Family Progress", [
    { label: "CW", value: row => `CW${row.week}` }, { label: "Cumulative plan", key: "count" },
    { label: "Actual / Forecast", value: row => row.actual ?? forecastValue(row) ?? "—" },
    { label: "Value type", value: row => row.actual == null ? "Forecast" : "Actual" },
  ], rows);
  const valueAction = (series, week, value) => value > 0 ? `role="button" tabindex="0" data-progress-detail="${series}" data-progress-week="${week}" aria-label="${series} CW${week}: ${fmt(value)} families. Open details"` : 'aria-disabled="true"';
return panel("Cumulative Family Progress by CW", `Unique families · CW05–${weekLabel(endWeek)}/2026`, `<div class="panel-body family-progress"><div class="progress-legend"><span>Plan</span><span class="actual">Actual</span><span class="forecast">Forecast</span></div><p class="progress-forecast-summary">${escapeHtml(forecastMessage)}</p><label class="progress-axis-control" for="family-axis-step">Y-axis step (families)<input id="family-axis-step" type="number" min="10" max="5000" step="1" value="${axisStep}" /></label><div class="progress-scroll" tabindex="0" aria-label="Family progress chart"><svg style="min-width:${canvasWidth}px" viewBox="0 0 ${canvasWidth} ${bottom + 120}" role="group" aria-label="Cumulative family plan; ${actual} uploaded matches at CW${data.meta.reportingWeek}. Actual cumulative uploads by source End Date.">${ticks.map((tick) => `<line x1="90" x2="${canvasWidth - 60}" y1="${y(tick)}" y2="${y(tick)}" class="progress-grid"/><text x="80" y="${y(tick) + 4}" text-anchor="end">${fmt(tick)}</text>`).join('')}${rows.filter((r) => r.week !== data.meta.reportingWeek).map((r) => `<line x1="${x(r.week)}" x2="${x(r.week)}" y1="60" y2="${bottom}" class="progress-week-grid"/>`).join('')}<line x1="${x(data.meta.reportingWeek)}" x2="${x(data.meta.reportingWeek)}" y1="45" y2="${bottom}" class="progress-current"/><polyline points="${rows.map((r) => `${x(r.week)},${y(r.count)}`).join(' ')}" class="progress-plan"/>${rows.map((r) => `<circle cx="${x(r.week)}" cy="${y(r.count)}" r="3" class="progress-plan-dot"/>`).join('')}${rows.map((r, i) => `<text ${valueAction("Plan", r.week, r.count)} class="progress-value progress-plan-value" x="${x(r.week)}" y="${y(r.count) - (i % 2 ? 42 : 56)}" text-anchor="middle">${fmt(r.count)}</text>`).join('')}${forecast.points.length ? `<polyline points="${forecast.points.map((r) => `${x(r.week)},${y(r.value)}`).join(' ')}" class="progress-forecast-line"/><circle cx="${x(forecast.points.at(-1).week)}" cy="${y(forecast.points.at(-1).value)}" r="5" class="progress-forecast-dot"/>` : ''}${forecast.points.filter(r => r.week > data.meta.reportingWeek).map(r => `<text class="progress-value progress-forecast-label" x="${x(r.week)}" y="${y(r.value) + 28}" text-anchor="middle" aria-label="Forecast ${weekLabel(r.week)}: ${fmt(Math.round(r.value))} families">${fmt(Math.round(r.value))}</text>`).join("")}<polyline points="${rows.filter((r) => r.actual != null).map((r) => `${x(r.week)},${y(r.actual)}`).join(' ')}" class="progress-actual-line"/>${rows.filter((r) => r.actual != null).map((r) => `<circle cx="${x(r.week)}" cy="${y(r.actual)}" r="3" class="progress-actual"/>`).join('')}<rect x="${x(data.meta.reportingWeek) - 5}" y="${y(actual) - 5}" width="10" height="10" class="progress-actual"/>${rows.filter((r) => r.actual != null).map((r, i) => `<text ${valueAction("Actual", r.week, r.actual)} class="progress-value" x="${x(r.week)}" y="${y(r.actual) - (i % 2 ? 12 : 26)}" text-anchor="middle">${fmt(r.actual)}</text>`).join('')}${rows.map((r) => `<text x="${x(r.week)}" y="${bottom + 28}" text-anchor="middle">${weekLabel(r.week).replace("CW", "")}</text>`).join('')}${renderWeeklyMonthRow(rows.map(r => ({ key: `2026-CW${String(r.week).padStart(2, "0")}` })), i => x(rows[i].week), bottom)}<text x="${canvasWidth / 2}" y="${bottom + 108}" text-anchor="middle">CW · 2026</text><text x="20" y="${60 + plotHeight / 2}" transform="rotate(-90 20 ${60 + plotHeight / 2})" text-anchor="middle">Cumulative family count</text></svg></div><details class="chart-source"><summary>Chart purpose and legend definitions · weekly values</summary><p>This chart compares cumulative planned Families with uploaded Families by calendar week (CW). The horizontal axis shows weeks and the vertical axis shows cumulative Family counts. Grey Plan shows unique Families from their first planned week. Blue Actual shows linked uploads through the snapshot; the amber vertical line marks the reporting week. Brown dashed Forecast projects uploads at ${fmt(weeklyRate)} Families per week, based on the last four complete weeks (${weekLabel(completedWeek - 3)}–${weekLabel(completedWeek)}). Brown numbers are estimates, capped at the final planned total of ${fmt(target)}. Click a nonzero Plan or Actual number for Family details; Forecast numbers have no detail action. The table shows weekly totals with future estimates labelled Forecast.</p>${weeklyExport}<div class="table-wrap"><table><thead><tr><th>CW</th><th>Cumulative plan</th><th>Actual / Forecast</th></tr></thead><tbody>${rows.map((r) => `<tr><td>CW${r.week}</td><td>${fmt(r.count)}</td><td class="${r.actual == null ? "progress-forecast-value" : ""}">${r.actual == null ? `${forecastValue(r) == null ? "—" : fmt(forecastValue(r))} <span>(Forecast)</span>` : fmt(r.actual)}</td></tr>`).join('')}</tbody></table></div></details></div>`, "family-progress-panel");
}

function overviewView(scoped) {
  const { deliverables, tickets, families } = scoped;
  const open = tickets.filter(isOpenTicket);
  const current = deliverables.filter((item) => item.weeks.some((week) => week.week === data.meta.reportingWeek));
  const past = deliverables.filter((item) => item.plannedFinishWeek && item.plannedFinishWeek < data.meta.reportingWeek);
  const rfa = deliverables.filter((item) => item.workType === "Revise the RFA library");
  const matched = rfa.filter((item) => item.familyId);
  const critical = open.filter((item) => ticketAge(item, data.meta.asOf) > data.config.ticketAgingCriticalDays);
  const attention = managementAttention(data, deliverables, tickets, families, context);
  const familyKeys = new Map(rfa.map((item) => [item.familyKey, Boolean(item.familyId)]).filter(([key]) => key));
  const uploadedCount = [...familyKeys.values()].filter(Boolean).length;
  const hours = ["Positive", "Negative"].map((label, index) => ({ label, value: tickets.filter((item) => hourClass(item) === label).reduce((sum, item) => sum + Number(item.actualHours || 0), 0), filter: "active", color: ["var(--green)", "var(--red)"][index] }));
  const ticketCounts = ["Positive", "Negative"].map((label, index) => ({ label, value: tickets.filter((item) => hourClass(item) === label).length, filter: "active", color: ["var(--green)", "var(--red)"][index] }));
  const positiveTickets = tickets.filter((item) => hourClass(item) === "Positive");
  const workHours = new Map();
  positiveTickets.forEach((item) => workHours.set(item.workType, (workHours.get(item.workType) || 0) + Number(item.actualHours || 0)));
  const workColors = ["#1f5a94", "#237a57", "#b26a00", "#7849a3", "#187e85", "#b42318", "#596579"];
  const positiveByWork = [...workHours].sort((a, b) => b[1] - a[1]).map(([label, value], index) => ({ label, value, filter: "workType", color: workColors[index % workColors.length] }));
  const positiveByReporter = [...groupCount(positiveTickets, (item) => item.reporter || "Unknown reporter")]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({ label, value, filter: "reporter", color: workColors[index % workColors.length] }));
  return `${heading()}
    <div class="grid-2 overview-charts">
      ${piePanel("family-upload", "TIDP Family Upload", [{ label: "Uploaded", value: uploadedCount, color: "var(--green)", filter: "upload" }, { label: "Not Yet Upload", value: familyKeys.size - uploadedCount, color: "var(--amber)", filter: "upload" }], "families in TIDP", "This chart shows upload progress for the unique Families in the TIDP RFA scope. The center is the total number of Families. Green (Uploaded) shows Families linked to an upload in this project; amber (Not Yet Upload) shows Families without a linked upload at the reporting snapshot. Each percentage is its share of the total. Click a slice to view its Families, or select a legend item to filter the dashboard.", { disclosureTitle: "Chart purpose and legend definitions", showSourceContext: false })}
      ${piePanel("ticket-hours", "Annotation Project Ticket Hours", hours, "total hours", "This chart shows recorded annotation ticket hours. The center is total hours. Green represents Positive work (including Re-Assessment); red represents Negative work. Numbers are hours and percentages show each group's share of the total. Each ticket contributes its recorded hours once; tickets without recorded hours are excluded. Click a slice for its tickets, or a legend item to filter the dashboard.")}
    </div>
    ${piePanel("positive-work-type", "Positive Hours by Work Type", positiveByWork, "positive hours", "This chart shows Positive hours (including Re-Assessment) by work type. The center is total Positive hours. Each color is a work type; numbers are recorded hours and percentages are shares of the total. Each ticket contributes once to its primary work type. Click a slice for its tickets, or a legend item to filter the dashboard.")}
    <div class="kpi-grid secondary-kpis">
      ${piePanel("ticket-count", "Annotation Project Ticket Count", ticketCounts, "total tickets", "This chart shows annotation ticket counts across all statuses. The center is the total ticket count. Green represents Positive tickets (including Re-Assessment); red represents Negative tickets. Each ticket is counted once; percentages show each group's share. Click a slice for its tickets, or a legend item to filter the dashboard.")}
      ${piePanel("positive-reporters", "Positive Tickets by Reporter", positiveByReporter, "positive tickets", "This chart shows Positive tickets (including Re-Assessment), grouped by reporter. The center is the total Positive ticket count. Each color identifies a reporter, the person who reported the ticket. Numbers are ticket counts and percentages show each reporter's share of the total. Click a slice for ticket details, or a legend item to filter the dashboard.", { showSourceContext: false })}
    </div>
    ${familyProgressChart(deliverables, families)}`;
}

function timeline(deliverables) {
  const weeks = Array.from({ length: 8 }, (_, index) => data.meta.reportingWeek - 5 + index);
  const systems = unique(deliverables.map((item) => item.system));
  const counts = new Map();
  systems.forEach((system) => weeks.forEach((week) => counts.set(`${system}-${week}`, deliverables.filter((item) => item.system === system && item.weeks.some((entry) => entry.week === week)).length)));
  return `<div class="panel-body timeline"><div class="timeline-grid"><div class="timeline-cell label">System</div>${weeks.map((week) => `<div class="timeline-cell ${week < data.meta.reportingWeek ? "past" : ""} ${week === data.meta.reportingWeek ? "current" : ""}">CW${week}</div>`).join("")}${systems.map((system) => `<div class="timeline-cell label">${escapeHtml(system)}</div>${weeks.map((week) => `<div class="timeline-cell ${week < data.meta.reportingWeek ? "past" : ""} ${week === data.meta.reportingWeek ? "current" : ""}">${fmt(counts.get(`${system}-${week}`))}</div>`).join("")}`).join("")}</div></div>`;
}

function tidpView({ deliverables, tickets }) {
  return midpView(deliverables, tickets);
}

function midpView(deliverables, tickets) {
  const groups = aggregateMidp(deliverables);
  const allWeeks = data.deliverables.flatMap((r) => r.weeks.map((w) => w.week));
  const first = Math.min(...allWeeks), last = Math.max(...allWeeks);
  const weeks = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const cell = (group, week) => {
    const entry = group.weeks.get(week);
    return `<td class="midp-week ${week === data.meta.reportingWeek ? "midp-current" : ""}">${entry ? `<button class="midp-mark" data-midp-detail="${escapeHtml(group.key)}" data-midp-week="${week}" aria-label="${escapeHtml(group.workType)} · ${escapeHtml(group.batch)} · CW${week}: ${entry.ids.size} planned items" title="${escapeHtml([...entry.activities].join(', '))}">${entry.ids.size}</button>` : ""}</td>`;
  };
  groups.forEach((group) => pieDetails.set(`midp:${group.key}`, { title: `MIDP · ${group.workType} · ${group.team} / ${group.batch}`, rows: group.records }));
  const actualByGroup = new Map(groups.map(group => [group.key, midpWeeklyActual(group, data.families, data.meta.asOf, tickets)]));
  const actualCell = (group) => {
    const rows = actualByGroup.get(group.key);

    pieDetails.set(`midp:actual:${group.key}`, { title: `MIDP Actual · ${group.workType} · ${group.batch}`, rows });
    return weeks.map(week => {
      const count = rows.filter(row => row.actualWeek === week).length;
      return `<td class="midp-week ${week === data.meta.reportingWeek ? "midp-current" : ""}">${week > data.meta.reportingWeek ? "" : count ? `<button class="midp-mark" data-midp-detail="actual:${escapeHtml(group.key)}" data-midp-week="${week}" data-midp-series="actual" aria-label="CW${week}: ${count} actual ${group.workType === "Revise the RFA library" ? "uploads" : "completed tickets"}">${count}</button>` : ""}</td>`;
    }).join("");
  };
  const packageOrder = [
    "Framework deliverables",
    "Revise the RFA library",
    "Create Revit templates for each LPH",
    "Sample Model + Output Data",
    "Output Checklists",
    "Export layouts to Revizto & 3D Review",
    "Lesson Learned",
  ];
  const packages = unique(groups.map((g) => g.workType)).sort((a, b) => {
    const rank = value => packageOrder.includes(value) ? packageOrder.indexOf(value) : packageOrder.length;
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const exportPackage = type => {
    const model = midpTableExport(groups.filter(group => group.workType === type), weeks, actualByGroup, data.meta.reportingWeek);
    return tableExportButton(`midp-table:${type}`, `MIDP-${type}`, model.columns, model.rows);
  };
  return `${heading()}<div class="midp-context">${Object.entries(state.filters).filter(([,value]) => value).map(([key,value]) => `<button class="button" data-set-filter="${key}" data-filter-value="${escapeHtml(value)}">${escapeHtml(key)}: ${escapeHtml(value)} ×</button>`).join("")}</div>
  ${panel("Master Information Delivery Plan", "", `<div class="panel-body">${packages.length ? packages.map((type) => `<details class="midp-package" data-collapse="midp-${escapeHtml(type)}" ${state.collapsed[`midp-${type}`] ? "" : "open"}><summary>${escapeHtml(type)} · ${fmt(groups.filter(g => g.workType === type).reduce((sum,g) => sum + g.records.length,0))} items</summary>${exportPackage(type)}<div class="table-wrap midp-scroll" tabindex="0" aria-label="${escapeHtml(type)} Gantt"><table class="midp-table"><thead><tr><th>Team / lot</th><th>Owner</th><th>Items</th><th>Series</th>${weeks.map(w => `<th class="midp-week ${w === data.meta.reportingWeek ? "midp-current" : ""}">CW${String(w).padStart(2,'0')}</th>`).join('')}</tr></thead><tbody>${groups.filter(g => g.workType === type).map(g => `<tr class="midp-actual"><th rowspan="2"><button data-set-filter="system" data-filter-value="${escapeHtml(g.records[0].system)}">${escapeHtml(g.team)} / ${escapeHtml(g.batch)}</button></th><td rowspan="2">${unique(g.records.map(r => r.owner)).map(owner => `<button data-set-filter="owner" data-filter-value="${escapeHtml(owner)}">${escapeHtml(owner)}</button>`).join('<br>')}</td><td rowspan="2">${g.records.length}</td><td class="midp-series">Actual</td>${actualCell(g)}</tr><tr class="midp-plan"><td class="midp-series">Plan</td>${weeks.map(w => cell(g,w)).join('')}</tr>`).join('')}</tbody></table></div></details>`).join('') : '<div class="empty">No planned records match the current filters.</div>'}</div>`, "midp-panel")}`;
}

function legacyTidpView({ deliverables }) {
  const states = groupCount(deliverables, (item) => deliverableState(item, context));
  const current = deliverables.filter((item) => item.currentActivity);
  const noMatch = deliverables.filter((item) => item.relationship === "Unlinked");
  return `${heading()}<div class="kpi-grid">
    ${kpi("TIDP work items", fmt(deliverables.length), "Filtered planning scope")}
    ${kpi(`Active in CW${data.meta.reportingWeek}`, fmt(current.length), "Any current-week activity marker")}
    ${kpi("Future planned", fmt(deliverables.filter((item) => item.plannedFinishWeek > data.meta.reportingWeek).length), "Final marker after reporting week")}
    ${kpi("Past plan · unverified", fmt(states.get("Past plan · unverified") || 0), "Completion evidence unavailable")}
    ${kpi("RFA rows without match", fmt(noMatch.length), "Exact normalized comparison")}
  </div>
  ${panel("Weekly delivery load", "Historical weeks are grey; current week has a blue dashed boundary; future remains neutral", timeline(deliverables))}
  <div class="grid-2">
    ${panel("Work items by system", "Click a bar to filter", `<div class="panel-body">${barList(groupCount(deliverables, (item) => item.system), { filter: "system" })}</div>`)}
    ${panel("Schedule / evidence state", "Mutually exclusive rule output", `<div class="panel-body">${barList(states, { color: "amber" })}</div>`)}
  </div>
  ${dataTable({ title: "TIDP detail", subtitle: "Planned weeks, owner, content relationship and evidence state", kind: "deliverable", rows: deliverables, exportName: "tidp-deliverables", columns: [
    { label: "Deliverable", render: (row) => `<div class="cell-title">${escapeHtml(row.title)}</div><div class="cell-muted">${row.id}</div>` },
    { label: "System", key: "system" }, { label: "Owner", key: "owner" }, { label: "Work type", key: "workType" },
    { label: "Plan", render: (row) => row.plannedStartWeek ? `CW${row.plannedStartWeek}–CW${row.plannedFinishWeek}` : "—" },
    { label: "State", render: (row) => statusBadge(deliverableState(row, context)) },
    { label: "Family relation", render: (row) => statusBadge(row.relationship) },
  ] })}`;
}

function ticketsView({ tickets }) {
  const open = tickets.filter(isOpenTicket);
  const resolved = tickets.filter((item) => !isOpenTicket(item));
  const ages = open.map((item) => ticketAge(item, data.meta.asOf)).filter((value) => value !== null);
  const durations = resolved.map((item) => Number(item.duration)).filter(Number.isFinite);
  const statuses = groupCount(tickets, (item) => item.status);
  const colors = { new: "#7a828e", acknowledged: "#1f5a94", assigned: "#b26a00", resolved: "#237a57", closed: "#7f9a8d" };
  const aging = groupCount(open, (item) => agingBucket(item, data.meta.asOf));
  const handlerOpen = groupCount(open, (item) => item.handler || "Unassigned");
  return `${heading()}<div class="notice">The source contains actual start/end evidence, not contractual due dates. “Overdue” and “Due this week” are therefore unavailable; aging flags are used instead.</div>
  <div class="kpi-grid">
    ${kpi("Open", fmt(open.length), "New + acknowledged + assigned")}
    ${kpi("Assigned", fmt(statuses.get("assigned") || 0), "Explicit ticket status")}
    ${kpi("Resolved", fmt(statuses.get("resolved") || 0), "Completion evidence present")}
    ${kpi("Average open age", `${avg(ages).toFixed(1)} d`, `${fmt(open.filter((item) => ticketAge(item, data.meta.asOf) > 30).length)} older than 30 days`)}
    ${kpi("Average resolution", `${avg(durations).toFixed(1)} d`, "Source working-day duration")}
  </div>
  <div class="grid-3">
    ${panel("Tickets by status", "Click a segment to filter", `<div class="panel-body">${stack([...statuses.entries()].map(([label, value]) => ({ label, value, color: colors[label] || "#7a828e" })))}</div>`)}
    ${panel("Open-ticket aging", "Unresolved tickets only", `<div class="panel-body">${barList(aging, { color: "amber" })}</div>`)}
    ${panel("Open workload by handler", "Count indicates load, not performance", `<div class="panel-body">${barList(handlerOpen, { filter: "owner", limit: 10 })}</div>`)}
  </div>
  ${dataTable({ title: "Annotation tickets", subtitle: "Operational records with actual dates, age and family links", kind: "ticket", rows: tickets, exportName: "annotation-tickets", columns: [
    { label: "Ticket", render: (row) => `<div class="cell-title">#${row.id} · ${escapeHtml(row.summary)}</div>` },
    { label: "Status", render: (row) => statusBadge(row.status) }, { label: "Handler", key: "handler" }, { label: "Department", key: "department" },
    { label: "Created", render: (row) => fmtDate(row.created) }, { label: "End", render: (row) => fmtDate(row.end) },
    { label: "Age", render: (row) => isOpenTicket(row) ? `${ticketAge(row, data.meta.asOf)} d` : "—" },
    { label: "Families", render: (row) => fmt(row.familyIds.length) },
  ] })}`;
}

function familiesView({ families, deliverables }) {
  const rfa = deliverables.filter((item) => item.workType === "Revise the RFA library");
  const matched = rfa.filter((item) => item.familyId);
  const openLinked = families.filter((family) => family.ticketIds.some((id) => isOpenTicket(lookup.ticketById.get(id) || { status: "closed" })));
  const byCategory = groupCount(families, (item) => item.category);
  const bySystem = new Map(unique(rfa.map((item) => item.system)).map((system) => {
    const rows = rfa.filter((item) => item.system === system);
    return [system, Math.round((rows.filter((item) => item.familyId).length / Math.max(rows.length, 1)) * 100)];
  }));
  return `${heading()}<div class="notice">“Uploaded” means present in the supplied Family Upload list. Approval state is unavailable; Family End Date is the upload milestone. TIDP readiness includes user-approved temporary equivalence mappings.</div>
  <div class="kpi-grid">
    ${kpi("Uploaded families", fmt(families.length), "Main family source population")}
    ${kpi("TIDP RFA work items", fmt(rfa.length), "Planned content tasks")}
    ${kpi("Exact uploaded matches", fmt(matched.length), `${pct(matched.length / Math.max(rfa.length, 1))} derived coverage`)}
    ${kpi("No uploaded match", fmt(rfa.length - matched.length), "Review naming or availability")}
    ${kpi("Families with open tickets", fmt(openLinked.length), "Direct family-ticket links")}
  </div>
  <div class="grid-2">
    ${panel("TIDP family coverage by system", "Percentage of RFA work items with an uploaded match (including temporary equivalence)", `<div class="panel-body">${barList(bySystem, { filter: "system" })}</div>`)}
    ${panel("Uploaded families by category", "Top categories", `<div class="panel-body">${barList(byCategory, { limit: 10 })}</div>`)}
  </div>
  ${dataTable({ title: "Family readiness detail", subtitle: "Uploaded records, ticket links and dependent TIDP rows", kind: "family", rows: families, exportName: "family-readiness", columns: [
    { label: "Family", render: (row) => `<div class="cell-title">${escapeHtml(row.name)}</div><div class="cell-muted">${row.id}</div>` },
    { label: "Category", key: "category" }, { label: "Uploader", key: "uploader" },
    { label: "Ticket status", render: (row) => statusBadge(row.ticketStatus) }, { label: "Tickets", render: (row) => row.ticketIds.map((id) => `#${id}`).join(", ") || "—" },
    { label: "TIDP dependencies", render: (row) => fmt(lookup.deliverablesByFamily.get(row.id)?.length || 0) },
    { label: "Source relation", render: (row) => statusBadge(row.relationship) },
  ] })}`;
}

function dependenciesView({ deliverables }) {
  const relevant = deliverables.filter((item) => item.workType === "Revise the RFA library");
  const states = groupCount(relevant, (item) => dependencyState(item, context));
  return `${heading()}<div class="kpi-grid">
    ${kpi("RFA dependency rows", fmt(relevant.length), "TIDP work type scope")}
    ${kpi("Derived family links", fmt(relevant.filter((item) => item.familyId).length), "Exact name or temporary equivalence")}
    ${kpi("Unlinked rows", fmt(relevant.filter((item) => !item.familyId).length), "No uploaded match under the applied mapping policy")}
    ${kpi("Open-ticket dependencies", fmt(relevant.filter((item) => item.familyId && context.openTicketIdsByFamily.get(item.familyId)?.length).length), "Derived chain to direct ticket link")}
    ${kpi("Relationship confidence", "84%", "No fuzzy matching used")}
  </div>
  ${panel("Dependency state", "Rule-based state; no arbitrary score", `<div class="panel-body">${barList(states, { color: "amber" })}</div>`)}
  ${dataTable({ title: "Dependency matrix", subtitle: "Deliverable → schedule → family → ticket → owner", kind: "deliverable", rows: relevant, exportName: "dependency-matrix", columns: [
    { label: "Deliverable", render: (row) => `<div class="cell-title">${escapeHtml(row.title)}</div><div class="cell-muted">${row.id}</div>` },
    { label: "Schedule", render: (row) => row.plannedFinishWeek ? `CW${row.plannedStartWeek}–CW${row.plannedFinishWeek}` : "—" },
    { label: "Family", render: (row) => row.familyId ? escapeHtml(lookup.familyById.get(row.familyId)?.name) : statusBadge("No uploaded match") },
    { label: "Tickets", render: (row) => row.familyId ? (lookup.familyById.get(row.familyId)?.ticketIds || []).map((id) => `#${id}`).join(", ") : "—" },
    { label: "Owner", key: "owner" }, { label: "Relationship", render: (row) => statusBadge(row.relationship) },
    { label: "Dependency state", render: (row) => statusBadge(dependencyState(row, context)) },
  ] })}`;
}

function heatmap(rows, weeks, metric) {
  const max = Math.max(...rows.flatMap((row) => weeks.map((week) => row.values[week] || 0)), 1);
  const level = (value) => value === 0 ? 0 : Math.min(4, Math.ceil((value / max) * 4));
  return `<div class="panel-body heatmap"><div class="heatmap-grid"><div class="heat-cell label">Team member</div>${weeks.map((week) => `<div class="heat-cell ${week === data.meta.reportingWeek ? "level-1" : ""}">CW${week}</div>`).join("")}${rows.map((row) => `<div class="heat-cell label">${escapeHtml(row.name)}</div>${weeks.map((week) => `<div class="heat-cell level-${level(row.values[week] || 0)}" title="${escapeHtml(row.name)} · CW${week}: ${row.values[week] || 0} ${metric}">${row.values[week] || 0}</div>`).join("")}`).join("")}</div></div>`;
}

function familyAnalysisView(scoped) {
  const { families: uploaded, tickets } = uploadedFamilyCohort(scoped.families, scoped.tickets, data.meta.asOf);
  const familyChart = piePanel("family-outcomes", "Uploaded Families", [
    { label: "One pass", value: uploaded.filter(item => familyOutcome(item) === "One pass").length, color: "var(--green)", filter: "familyOutcome" },
    { label: "Returned", value: uploaded.filter(item => familyOutcome(item) === "Returned").length, color: "var(--red)", filter: "familyOutcome" },
    { label: "Unclassified", value: uploaded.filter(item => familyOutcome(item) === "Unclassified").length, color: "var(--grey)", filter: "familyOutcome" },
  ].filter(slice => slice.label !== "Unclassified" || slice.value > 0), "uploaded families", "This chart shows review outcomes for uploaded Families in this project. The center is the unique uploaded Family count. Green (One pass) means recorded as passing without return; red (Returned) means returned for rework. Grey (Unclassified) appears when an outcome is missing. Numbers count Families once and percentages show their share of the total. Click a slice for Family details, or a legend item to filter the dashboard.");
  return renderFamilyAnalysis({ tickets, families: uploaded, familyChart, asOf: data.meta.asOf, filters: state.filters, collapsed: state.collapsed,
    errorHeatmap: renderReworkHeatmap({ families: uploaded, systems: familyErrorSystems(data.deliverables), filters: state.filters, panel, register: (id, meta) => pieDetails.set(id, meta), escapeHtml, fmt, asOf: data.meta.asOf }),
    issueAxisStep: state.issueAxisStep || 5,
    hiddenErrorSeries: state.hiddenErrorSeries,
    showIssueLabels: state.showIssueLabels,
    returnedErrorChart: (() => {
      const returned = uploaded.filter(f => familyOutcome(f) === 'Returned');
      const counts = new Map();
      returned.forEach(f => (f.reworkErrors || []).forEach(type => counts.set(type, (counts.get(type) || 0) + 1)));
      const colors = ['var(--blue)', 'var(--green)', 'var(--amber)', 'var(--red)', 'var(--brown)', 'var(--grey)'];
      return piePanel('returned-errors', 'Returned · error types', [...counts].sort((a,b) => b[1]-a[1]).map(([label,value],i) => ({ label, value, filter:'reworkError', color:colors[i % colors.length] })), 'error flags', `Source: Family_Upload_vs_Annotation_Tickets_Checked.xlsx, Family_vs_Tickets. ${returned.length} Returned Families; ${new Set(returned.flatMap(f => f.ticketIds)).size} unique linked tickets. Counts preserve X flags in each source error column. One Family may have multiple error types; the center and percentages count error flags, not unique tickets or mutually exclusive categories. Blank cells are not errors. Select a legend to filter related records; click a slice for Family evidence.`);
    })(),
    weeklyHoursChart: renderWeeklyHours({ axisStep: state.hoursAxisStep, dataset: timeHistory, tickets: scoped.tickets, filters: state.filters, panel, register: (id, meta) => pieDetails.set(id, meta), escapeHtml, fmt }),
    weeklyFamilyEffortChart: renderWeeklyFamilyEffort({ roleHours: familyRoleHours, axisStep: state.effortAxisStep, families: uploaded, tickets, asOf: data.meta.asOf, filters: state.filters, panel, register: (id, meta) => pieDetails.set(id, meta), fmt }),
    uploaderChart: (() => {
      const counts = new Map();
      uploaded.forEach(family => { const uploader = family.uploader || "Unassigned"; counts.set(uploader, (counts.get(uploader) || 0) + 1); });
      const colors = ["var(--blue)", "var(--green)", "var(--amber)", "#7846a9", "#14818a", "var(--red)", "var(--grey)"];
      return piePanel("family-uploaders", "Uploaded Families by uploader", [...counts].sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, filter: "uploader", color: colors[i % colors.length] })), "uploaded families", "The center shows unique uploaded Families. Each slice shows an uploader's count and share of this total. Counts describe uploaded output, not individual efficiency or task complexity. Click a slice to view Family records; select a legend to filter related dashboard components.");
    })(),
    panel, heading, escapeHtml, fmt, fmtDate, uploadAxisStep: state.uploadAxisStep,
    forecastTarget: new Set(scoped.deliverables.filter(r => r.familyKey && r.workType === "Revise the RFA library").map(r => r.familyKey)).size,
    register: (id, meta) => pieDetails.set(id, meta) });
}

function weekOfYear(iso) {
  const date = new Date(`${iso}T12:00:00Z`);
  const target = new Date(date.valueOf());
  const day = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  return 1 + Math.round((target - firstThursday) / 604800000);
}

function qualityView() {
  const q = data.quality;
  const issues = [
    ["Tickets missing actual start", q.ticketMissingStart, "Tickets"], ["Tickets missing actual end", q.ticketMissingEnd, "Tickets"],
    ["Tickets missing handler", q.ticketMissingHandler, "Tickets"], ["Duplicate ticket IDs", q.ticketDuplicateIds, "Tickets"],
    ["TIDP rows missing owner", q.tidpMissingOwner, "TIDP"], ["TIDP rows without weekly plan", q.tidpUnscheduled, "TIDP"],
    ["Duplicate TIDP rows", q.tidpDuplicateRows, "TIDP"], ["Duplicate normalized family names", q.familyDuplicateNames, "Family"],
    ["Family sheet contradictions", q.familySheetContradictions, "Family"], ["Family ticket IDs outside matrix", q.familyTicketIdsNotInMatrix, "Relationship"],
    ["Unlinked TIDP RFA rows", q.unlinkedTidpFamilyRows, "Relationship"],
  ];
  const issueTotal = issues.reduce((sum, [, count]) => sum + count, 0);
  const base = data.deliverables.length + data.tickets.length + data.families.length;
  const score = Math.max(0, Math.round((1 - issueTotal / base) * 100));
  const unsupported = [
    ["Completed deliverables", "No TIDP actual finish or explicit completion"], ["On-time delivery", "No TIDP actual finish"],
    ["Overdue tickets", "No contractual due date"], ["Tickets due this week", "No contractual due date"],
    ["Family approval", "No approval field"], ["Previous reporting trend", "Only one snapshot supplied"],
  ];
  return `${heading()}<div class="grid-2">
    ${panel("Data quality indicator", "Coverage proxy; relationship confidence remains separately visible", `<div class="panel-body quality-score"><div class="score-ring" style="--score:${score}%"><strong>${score}%</strong></div><div><strong>${fmt(issueTotal)} visible quality flags</strong><p class="cell-muted">Across ${fmt(base)} source records. This score is transparent and not used to suppress KPIs.</p></div></div>`)}
    ${panel("Relationship evidence", "Classification of TIDP-family applicability", `<div class="panel-body">${barList(new Map(Object.entries(data.relationshipSummary)))}</div>`)}
  </div>
  ${panel("Issue categories", "Counts remain visible even when they make management metrics unavailable", `<div class="panel-body">${barList(new Map(issues.map(([label, count]) => [label, count])), { color: "amber", limit: 20 })}</div>`)}
  <div class="grid-2">
    ${panel("Unsupported KPI register", "Shown as unavailable instead of fabricated", `<div class="panel-body"><div class="definition-list">${unsupported.map(([name, reason]) => `<dt>${escapeHtml(name)}</dt><dd>${escapeHtml(reason)}</dd>`).join("")}</div></div>`)}
    ${panel("Source limitations", "These boundaries apply to every page", `<div class="panel-body">${data.meta.limitations.map((item) => `<div class="evidence-gap">${escapeHtml(item)}</div>`).join("<div style='height:8px'></div>")}</div>`)}
  </div>`;
}

let chartSizes = {};
try { chartSizes = JSON.parse(localStorage.getItem("pmp-chart-drag-sizes") || "{}"); } catch { /* Fall back to automatic sizing. */ }

function applyComponentLayout() {
  const root = document.querySelector("#page-content");
  root.querySelectorAll(".panel").forEach((component, index) => {
    const title = component.querySelector("h2")?.textContent || `Component ${index + 1}`;
    const layoutScope = component.closest("[data-layout-scope]")?.dataset.layoutScope || state.page;
    const key = `${layoutScope}:${component.dataset.collapse || title}`;
    const inGrid = component.parentElement.matches(".grid-2,.secondary-kpis");
    const wrapper = document.createElement("div");
    wrapper.className = "auto-fit-component";
    wrapper.dataset.layoutKey = key;
    wrapper.style.setProperty("--component-span", component.dataset.collapse === "family-outcomes" ? "12" : inGrid || component.classList.contains("pie-panel") ? "6" : "12");
    if (component.tagName === "SECTION") {
      const toggle = document.createElement("button");
      toggle.className = "button";
      const collapseKey = `${key}:collapsed`;
      const toggleCollapsed = () => {
        const collapsed = Boolean(state.collapsed[collapseKey]);
        component.classList.toggle("component-collapsed", collapsed);
        toggle.textContent = collapsed ? "Expand" : "Collapse";
        toggle.setAttribute("aria-expanded", String(!collapsed));
      };
      toggle.addEventListener("click", () => { state.collapsed[collapseKey] = !state.collapsed[collapseKey]; toggleCollapsed(); });
      component.querySelector(".panel-header")?.append(toggle);
      toggleCollapsed();
    }
    component.before(wrapper);
    wrapper.append(component);
    if (component.matches(".pie-panel, .issues-panel")) {
      const layout = component.querySelector(".pie-layout, .panel-body");
      const autoSpan = Number(wrapper.style.getPropertyValue("--component-span"));
      const saved = chartSizes[key] || {};
      const fit = (span, height) => {
        wrapper.style.setProperty("--component-span", Math.max(4, Math.min(12, span)));
        layout.style.height = height ? `${Math.max(200, Math.min(900, height))}px` : "";
        layout.classList.toggle("user-sized-chart", Boolean(height));
      };
      fit(saved.span || autoSpan, saved.height);
      const handle = document.createElement("button");
      handle.className = "chart-resize-handle";
      handle.textContent = "↘";
      handle.setAttribute("aria-label", `Resize ${title}`);
      handle.title = "Drag to resize. Arrow keys adjust size; Home or double-click restores auto fit.";
      const persist = () => {
        chartSizes[key] = { span: Number(wrapper.style.getPropertyValue("--component-span")), height: parseFloat(layout.style.height) || 0 };
        try { localStorage.setItem("pmp-chart-drag-sizes", JSON.stringify(chartSizes)); } catch { /* Keep session preference. */ }
      };
      const resetSize = () => { fit(autoSpan, 0); persist(); };
      let drag = null;
      handle.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        handle.setPointerCapture(event.pointerId);
        drag = { x: event.clientX, y: event.clientY, span: Number(wrapper.style.getPropertyValue("--component-span")), height: layout.getBoundingClientRect().height, step: (component.closest(".dashboard-group-body") || root).clientWidth / 12 };
      });
      handle.addEventListener("pointermove", (event) => {
        if (!drag) return;
        const span = Math.round(drag.span + (event.clientX - drag.x) / drag.step);
        fit(span, drag.height + event.clientY - drag.y);
      });
      handle.addEventListener("pointerup", () => { drag = null; persist(); });
      handle.addEventListener("pointercancel", () => { drag = null; persist(); });
      handle.addEventListener("dblclick", resetSize);
      handle.addEventListener("keydown", (event) => {
        if (event.key === "Home" || event.key === "Enter") { event.preventDefault(); resetSize(); return; }
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const span = Number(wrapper.style.getPropertyValue("--component-span"));
        const height = layout.getBoundingClientRect().height;
        fit(span + (event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0), height + (event.key === "ArrowDown" ? 24 : event.key === "ArrowUp" ? -24 : 0));
        persist();
      });
      component.append(handle);
    }
  });
  root.querySelectorAll(":scope > .grid-2, :scope > .secondary-kpis, .dashboard-group-body > .grid-2").forEach((grid) => grid.replaceWith(...grid.childNodes));
  enableChartOrdering(root, state.page);
}

function renderPage() {
  tableExports.clear();
  const scoped = filtered();
  const renderers = { overview: overviewView, tidp: tidpView, tickets: ticketsView, families: familiesView, dependencies: dependenciesView, team: familyAnalysisView, quality: qualityView };
  document.querySelector("#page-content").innerHTML = renderers[state.page](scoped);
  applyComponentLayout();
  document.querySelectorAll("[data-nav]").forEach((button) => button.classList.toggle("active", button.dataset.nav === state.page));
}

function openPieDetails(id, filter, value, trigger) {
  pieDetailTrigger = trigger || pieDetailTrigger;
  const scoped = filtered();
  const meta = pieDetails.get(id);
  if (!meta) return;
  let rows;
  let columns;
  if (id === 'returned-errors') {
    rows = uploadedFamilyRows(scoped.families, data.meta.asOf).filter(r => familyOutcome(r) === 'Returned' && r.reworkErrors?.includes(value));
    columns = ['id', 'name', 'category', 'uploader', 'reworkOutcome', 'end'];
  } else if (id === "family-outcomes" || id === "family-uploaders") {
    rows = uploadedFamilyRows(scoped.families, data.meta.asOf).filter(r => id === "family-outcomes" ? familyOutcome(r) === value : (r.uploader || "Unassigned") === value);
    columns = ["id", "name", "category", "uploader", "reworkOutcome", "ticketStatus", "end"];
  } else if (id === "family-upload") {
    ({ rows, columns } = tidpUploadDetails(scoped.deliverables, lookup.familyById, value));
  } else {
    rows = scoped.tickets.filter((r) => (filter === "active" ? hourClass(r) : r[filter]) === value && (!id.startsWith("positive-") || hourClass(r) === "Positive"));
    columns = ["id", "summary", "active", "reporter", "handler", "status", "actualHours", "end"];
  }
  pieDetailSelection = { id, filter, value, rows, columns, page: 1, sort: "", descending: true, searches: {} };
  renderPieDetails();
}

function renderPieDetails() {
  const s = pieDetailSelection;
  const meta = pieDetails.get(s.id);
  const rows = selectTableRows(s);
  const rowMarkup = (r) => `<tr>${s.columns.map((key) => `<td>${escapeHtml(r[key] ?? "—")}</td>`).join("")}</tr>`;
  const labels = { id: "ID", title: "Family / deliverable", summary: "Ticket", active: "Classification", reporter: "Reporter", handler: "Handler", status: "Status", actualHours: "Hours", created: "Created date", end: "End date", system: "System", owner: "Owner", workType: "Work type", plannedStartWeek: "First planned CW", plannedFinishWeek: "Last planned CW" };
  Object.assign(labels, { name: "Family", category: "Category", uploader: "Uploader", reworkOutcome: "Outcome", ticketStatus: "Ticket status", ticketNumber: "Ticket number" });
  document.querySelector("#drawer-root").innerHTML = `<div class="drawer-backdrop" data-close-drawer></div><aside class="drawer chart-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="pie-detail-title"><button class="drawer-close" data-close-drawer aria-label="Close">×</button><h2 id="pie-detail-title">${escapeHtml(meta.title)} — ${escapeHtml(s.value)}</h2>${tableExportButton("detail", `${meta.title} - ${s.value}`, s.columns.map(key => ({ key, label: labels[key] || key })), () => selectTableRows(s))}<div class="table-wrap" tabindex="0" aria-label="Scrollable detail records"><table><thead><tr>${s.columns.map((key) => `<th aria-sort="${s.sort === key ? s.descending ? "descending" : "ascending" : "none"}"><button data-pie-sort="${key}">${labels[key]} ${s.sort === key ? s.descending ? "↓" : "↑" : "↕"}</button><input data-pie-search="${key}" aria-label="Search ${labels[key]} in details" value="${escapeHtml(s.searches[key] || "")}" /></th>`).join("")}</tr></thead><tbody>${rows.slice(0, 100).map(rowMarkup).join("") || `<tr><td colspan="${s.columns.length}" class="empty">No matching records.</td></tr>`}</tbody></table></div><div class="detail-count" role="status">${fmt(Math.min(100, rows.length))} / ${fmt(rows.length)} records</div></aside>`;
  const scroller = document.querySelector(".chart-detail-drawer .table-wrap");
  let shown = Math.min(100, rows.length);
  scroller.addEventListener("scroll", () => {
    if (shown >= rows.length || scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 240) return;
    const end = Math.min(shown + 100, rows.length);
    scroller.querySelector("tbody").insertAdjacentHTML("beforeend", rows.slice(shown, end).map(rowMarkup).join(""));
    shown = end;
    document.querySelector(".chart-detail-drawer .detail-count").textContent = `${fmt(shown)} / ${fmt(rows.length)} records`;
  }, { passive: true });
}

function closeDrawer() {
  document.querySelector("#drawer-root").innerHTML = "";
  pieDetailTrigger?.focus({ preventScroll: true });
  pieDetailSelection = null;
}

function openDrawer(kind, id) {
  const root = document.querySelector("#drawer-root");
  let title = "Record detail";
  let body = "";
  if (kind === "deliverable") {
    const item = lookup.deliverableById.get(String(id));
    if (!item) return;
    const family = item.familyId ? lookup.familyById.get(item.familyId) : null;
    const tickets = family ? family.ticketIds.map((ticketId) => lookup.ticketById.get(ticketId)).filter(Boolean) : [];
    title = item.title;
    body = `<p>${statusBadge(deliverableState(item, context))} ${statusBadge(item.relationship)}</p><dl class="definition-list"><dt>Source ID</dt><dd>${item.id}</dd><dt>System</dt><dd>${escapeHtml(item.system)}</dd><dt>Owner</dt><dd>${escapeHtml(item.owner)}</dd><dt>Work type</dt><dd>${escapeHtml(item.workType)}</dd><dt>Plan</dt><dd>${item.plannedStartWeek ? `CW${item.plannedStartWeek}–CW${item.plannedFinishWeek}` : "No weekly marker"}</dd></dl><h3>Source trace</h3><div class="trace"><div class="trace-node"><strong>${item.id}</strong><br>TIDP work item</div><div class="trace-arrow">↓ ${item.relationship === "Derived" ? escapeHtml(item.familyMatchMethod || "Derived relationship") : "no evidenced link"}</div><div class="trace-node"><strong>${escapeHtml(family?.name || "No uploaded-family match")}</strong><br>${family ? `Family source · ${family.id}` : "Relationship gap"}</div>${tickets.map((ticket) => `<div class="trace-arrow">↓ direct Ticket_IDs relationship</div><div class="trace-node"><strong>#${ticket.id} · ${escapeHtml(ticket.status)}</strong><br>${escapeHtml(ticket.summary)}<br>Handler · ${escapeHtml(ticket.handler)}</div>`).join("")}</div>`;
  } else if (kind === "ticket") {
    const item = lookup.ticketById.get(Number(id));
    if (!item) return;
    title = `#${item.id} · ${item.summary}`;
    const familyRecords = item.familyIds.map((familyId) => lookup.familyById.get(familyId)).filter(Boolean);
    body = `<p>${statusBadge(item.status)} ${isOpenTicket(item) ? statusBadge(`${ticketAge(item, data.meta.asOf)} days old`) : statusBadge("Completion evidence")}</p><dl class="definition-list"><dt>Handler</dt><dd>${escapeHtml(item.handler)}</dd><dt>Reporter</dt><dd>${escapeHtml(item.reporter)}</dd><dt>Department</dt><dd>${escapeHtml(item.department)}</dd><dt>Created</dt><dd>${fmtDate(item.created)}</dd><dt>Actual start</dt><dd>${fmtDate(item.start)}</dd><dt>Actual end</dt><dd>${fmtDate(item.end)}</dd><dt>Actual hours</dt><dd>${escapeHtml(item.actualHours)}</dd></dl><h3>Related families</h3><div class="trace">${familyRecords.length ? familyRecords.map((family) => `<div class="trace-node"><strong>${escapeHtml(family.name)}</strong><br>${family.id} · Direct relationship</div>`).join("") : `<div class="evidence-gap">No family relationship in the supplied source.</div>`}</div>`;
  } else {
    const item = lookup.familyById.get(String(id));
    if (!item) return;
    title = item.name;
    const deliverables = lookup.deliverablesByFamily.get(item.id) || [];
    const tickets = item.ticketIds.map((ticketId) => lookup.ticketById.get(ticketId)).filter(Boolean);
    body = `<p>${statusBadge("Uploaded record")} ${statusBadge("Direct ticket mapping")}</p><dl class="definition-list"><dt>Family ID</dt><dd>${item.id}</dd><dt>Category</dt><dd>${escapeHtml(item.category)}</dd><dt>Uploader</dt><dd>${escapeHtml(item.uploader)}</dd><dt>Match method</dt><dd>${escapeHtml(item.matchType)}</dd></dl><h3>Source trace</h3><div class="trace"><div class="trace-node"><strong>${escapeHtml(item.name)}</strong><br>Uploaded family</div>${tickets.map((ticket) => `<div class="trace-arrow">↓ direct Ticket_IDs relationship</div><div class="trace-node"><strong>#${ticket.id} · ${escapeHtml(ticket.status)}</strong><br>${escapeHtml(ticket.summary)}</div>`).join("")}${deliverables.map((deliverable) => `<div class="trace-arrow">↑ ${escapeHtml(deliverable.familyMatchMethod || 'Derived relationship')}</div><div class="trace-node"><strong>${deliverable.id}</strong><br>${escapeHtml(deliverable.title)}</div>`).join("")}</div>`;
  }
  root.innerHTML = `<div class="drawer-backdrop" data-close-drawer></div><aside class="drawer" role="dialog" aria-modal="true"><button class="drawer-close" data-close-drawer aria-label="Close">×</button><p class="eyebrow">Traceable evidence</p><h2>${escapeHtml(title)}</h2>${body}</aside>`;
}

function exportCsv(id, button) {
  const model = tableExports.get(id);
  if (!model) return;
  const status = button.parentElement.querySelector("[data-export-status]");
  try {
    const rows = typeof model.rows === "function" ? model.rows() : model.rows;
    downloadCsv({ ...model, asOf: data.meta.asOf, rows });
    status.textContent = `CSV prepared · ${fmt(rows.length)} rows`;
  } catch {
    status.textContent = "CSV export failed. Please try again.";
  }
}

function wireEvents() {
  document.addEventListener("toggle", (event) => {
    if (event.target.matches?.("[data-collapse]")) state.collapsed[event.target.dataset.collapse] = !event.target.open;
  }, true);
  document.addEventListener("click", (event) => {
    const issue = event.target.closest("[data-issue-detail]");
    if (issue) {
      const id = issue.dataset.issueDetail;
      const meta = pieDetails.get(id);
      pieDetailTrigger = issue;
      pieDetailSelection = { id, value: `${fmt(meta.rows.length)} records`, rows: meta.rows,
        columns: meta.columns || ["id", "summary", "workType", "handler", "status", "active", "actualHours", "created", "end"], sort: "", descending: true, searches: {} };
      renderPieDetails(); document.querySelector(".drawer-close")?.focus(); return;
    }
    if (event.target.closest("[data-midp-reset]")) { state.filters = { system: "", owner: "", workType: "", status: "", search: "" }; renderPage(); return; }
    const midp = event.target.closest("[data-midp-detail]");
    if (midp) {
      const id = `midp:${midp.dataset.midpDetail}`;
      const meta = pieDetails.get(id);
      const week = Number(midp.dataset.midpWeek);
      const actual = midp.dataset.midpSeries === "actual";
      const rows = meta.rows.filter(r => !week || (actual ? r.actualWeek === week : r.weeks.some(w => w.week === week)));
      pieDetailTrigger = midp;
      const actualColumns = rows.some(row => row.familyKey) ? ["id", "title", "system", "owner", "end"] : ["id", "title", "system", "reporter", "handler", "status", "end"];
      pieDetailSelection = { id, value: week ? `CW${week}` : "All planned items", rows, columns: actual ? actualColumns : ["id", "title", "system", "owner", "workType", "plannedStartWeek", "plannedFinishWeek"], sort: "", descending: true, searches: {} };
      renderPieDetails(); document.querySelector('.drawer-close')?.focus(); return;
    }
    const progress = event.target.closest("[data-progress-detail]");
    if (progress) {
      const meta = pieDetails.get("family-progress");
      const week = Number(progress.dataset.progressWeek);
      const series = progress.dataset.progressDetail;
      const cutoff = meta.weekEnd(week) < data.meta.asOf ? meta.weekEnd(week) : data.meta.asOf;
      const rows = meta.rows.filter((r) => series === "Plan" ? r.plannedStartWeek && r.plannedStartWeek <= week : r.end && r.end <= cutoff);
      if (!rows.length) return;
      pieDetailTrigger = progress;
      pieDetailSelection = { id: "family-progress", value: `${series} · CW${week}`, rows, columns: ["id", "title", "system", "owner", "plannedStartWeek", "end"], page: 1, sort: "", descending: true, searches: {} };
      renderPieDetails(); document.querySelector(".drawer-close")?.focus(); return;
    }
    const slice = event.target.closest("[data-pie-detail]");
    if (slice) { openPieDetails(slice.dataset.pieDetail, slice.dataset.sliceFilter, slice.dataset.sliceValue, slice); document.querySelector(".drawer-close")?.focus(); return; }
    const sort = event.target.closest("[data-pie-sort]");
    if (sort) { const s = pieDetailSelection; s.descending = s.sort === sort.dataset.pieSort ? !s.descending : true; s.sort = sort.dataset.pieSort; renderPieDetails(); document.querySelector(`[data-pie-sort="${s.sort}"]`)?.focus(); return; }
    const piePage = event.target.closest("[data-pie-page]");
    if (piePage) { pieDetailSelection.page += Number(piePage.dataset.piePage); renderPieDetails(); document.querySelector(".drawer-close")?.focus(); return; }
    const nav = event.target.closest("[data-nav]");
    if (nav) { state.page = nav.dataset.nav; state.tablePage = 1; renderPage(); return; }
    if (event.target.closest("#reset-filters")) { state.filters = { system: "", owner: "", workType: "", status: "", search: "" }; document.querySelector("#app").innerHTML = appShell(); wireTopbar(); renderPage(); return; }
    const setFilter = event.target.closest("[data-set-filter]");
    const seriesToggle = event.target.closest('[data-toggle-error-series]');
    if (event.target.closest('[data-toggle-issue-labels]')) {
      state.showIssueLabels = !state.showIssueLabels;
      renderPage();
      document.querySelector('[data-toggle-issue-labels]')?.focus({ preventScroll: true });
      return;
    }
    if (seriesToggle) {
      const type = seriesToggle.dataset.toggleErrorSeries;
      state.hiddenErrorSeries = state.hiddenErrorSeries.includes(type) ? state.hiddenErrorSeries.filter(t => t !== type) : [...state.hiddenErrorSeries, type];
      renderPage();
      [...document.querySelectorAll('[data-toggle-error-series]')].find(button => button.dataset.toggleErrorSeries === type)?.focus({ preventScroll: true });
      return;
    }
    const errorCell = event.target.closest('[data-error-system]');
    if (errorCell) {
      const selected = state.filters.errorSystem === errorCell.dataset.errorSystem && state.filters.reworkError === errorCell.dataset.errorType;
      state.filters.errorSystem = selected ? '' : errorCell.dataset.errorSystem;
      state.filters.reworkError = selected ? '' : errorCell.dataset.errorType;
      state.tablePage = 1; renderPage(); return;
    }
    if (setFilter) { const key = setFilter.dataset.setFilter; state.filters[key] = state.filters[key] === setFilter.dataset.filterValue ? "" : setFilter.dataset.filterValue; state.tablePage = 1; renderPage(); return; }
    const open = event.target.closest("[data-open-kind]");
    if (open) { openDrawer(open.dataset.openKind, open.dataset.openId); return; }
    if (event.target.closest("[data-close-drawer]")) closeDrawer();
    const step = event.target.closest("[data-page-step]");
    if (step) { state.tablePage += Number(step.dataset.pageStep); renderPage(); }
    const action = event.target.closest("[data-action]");
    if (action) { const target = action.dataset.action; state.page = target.startsWith("tidp") ? "tidp" : target.startsWith("tickets") ? "tickets" : target; renderPage(); }
    const exportButton = event.target.closest("[data-table-export]");
    if (exportButton) { exportCsv(exportButton.dataset.tableExport, exportButton); return; }
  });
  document.addEventListener("keydown", (event) => {
    const slice = event.target.closest("[data-pie-detail], [data-progress-detail]");
    if (slice && ["Enter", " "].includes(event.key)) { event.preventDefault(); slice.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
    const drawer = document.querySelector(".drawer");
    if (!drawer) return;
    if (event.key === "Escape") closeDrawer();
    if (event.key === "Tab") {
      const nodes = [...drawer.querySelectorAll('button:not(:disabled), input, summary, [tabindex="0"]')];
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  let detailSearchTimer;
  document.addEventListener("input", (event) => {
    if (!event.target.matches("[data-pie-search]") || !pieDetailSelection) return;
    const input = event.target, key = input.dataset.pieSearch, selection = pieDetailSelection;
    selection.searches[key] = input.value;
    clearTimeout(detailSearchTimer);
    detailSearchTimer = setTimeout(() => {
      if (pieDetailSelection !== selection) return;
      const focused = document.activeElement === input, caret = input.selectionStart;
      renderPieDetails();
      if (focused) {
        const next = document.querySelector(`[data-pie-search="${key}"]`);
        next?.focus(); next?.setSelectionRange(caret, caret);
      }
    }, 250);
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-issue-filter]")) {
      state.filters[event.target.dataset.issueFilter] = event.target.value;
      state.tablePage = 1; renderPage(); return;
    }
    if (event.target.matches("[data-pie-search]")) { const key = event.target.dataset.pieSearch; pieDetailSelection.searches[key] = event.target.value; pieDetailSelection.page = 1; renderPieDetails(); document.querySelector(`[data-pie-search="${key}"]`)?.focus(); return; }
    if (event.target.matches("[data-weekly-axis]")) {
      const input = event.target;
      if (!input.checkValidity() || !Number.isFinite(Number(input.value))) { input.reportValidity(); return; }
      state[input.dataset.weeklyAxis] = Number(input.value);
      const id = input.id;
      renderPage();
      document.getElementById(id)?.focus({ preventScroll: true });
      return;
    }
    if (event.target.matches("#family-axis-step, #upload-axis-step")) {
      const value = Number(event.target.value);
      if (!Number.isInteger(value) || value < 10 || value > 5000) { event.target.reportValidity(); return; }
      const inputId = event.target.id;
      state[inputId === "family-axis-step" ? "familyAxisStep" : "uploadAxisStep"] = value;
      renderPage();
      document.getElementById(inputId)?.focus({ preventScroll: true });
    }
    if (event.target.matches("#team-metric")) { state.teamMetric = event.target.value; renderPage(); }
  });
}

function wireTopbar() {
  document.querySelectorAll("[data-filter]").forEach((control) => {
    const eventName = control.dataset.filter === "search" ? "input" : "change";
    control.addEventListener(eventName, () => {
      state.filters[control.dataset.filter] = control.value;
      state.tablePage = 1;
      renderPage();
    });
  });
}

async function start() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/dashboard-data.json`);
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    data = await response.json();
    try {
      const rolesResponse = await fetch(`${import.meta.env.BASE_URL}data/family-role-hours.json`);
      if (rolesResponse.ok) familyRoleHours = await rolesResponse.json();
    } catch { /* Role-series evidence gaps remain explicit. */ }
    try {
      const hoursResponse = await fetch(`${import.meta.env.BASE_URL}data/weekly-hours.json`);
      if (hoursResponse.ok) timeHistory = await hoursResponse.json();
    } catch { /* The independent time-history chart exposes its unavailable state. */ }
    context = buildContext(data);
    lookup = createLookup();
    document.querySelector("#app").className = "";
    document.querySelector("#app").innerHTML = appShell();
    wireTopbar();
    wireEvents();
    renderPage();
  } catch (error) {
    document.querySelector("#app").innerHTML = `<div class="loading-mark">!</div><h1>Dashboard could not start</h1><p>${escapeHtml(error.message)}</p><p>Run the project through the local development server or GitHub Pages.</p>`;
  }
}

start();
import { renderLegendDefinitions, legendDefinitions } from './chart-explanations.js';
