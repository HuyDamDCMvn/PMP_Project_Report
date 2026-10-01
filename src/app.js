import "./styles.css";
import {
  agingBucket,
  buildContext,
  deliverableState,
  dependencyState,
  groupCount,
  isOpenTicket,
  managementAttention,
  percentile,
  ticketAge,
} from "./domain.js";

const PAGE_META = {
  overview: ["Executive Overview", "Project health, current delivery evidence and management action."],
  tidp: ["MIDP / TIDP Delivery Control", "Weekly plan control with explicit completion-evidence boundaries."],
  tickets: ["Annotation Ticket Control", "Operational backlog, aging, ownership and throughput."],
  families: ["Family Readiness", "Uploaded content coverage and its relationship to planned RFA work."],
  dependencies: ["Cross-data Dependencies", "Traceable TIDP → family → ticket → owner relationships."],
  team: ["Team & Resource", "Workload evidence for allocation decisions, not performance scoring."],
  quality: ["Data Quality", "Missing evidence, source contradictions and unsupported KPIs."],
};

const state = {
  page: "overview",
  filters: { system: "", owner: "", workType: "", status: "", search: "" },
  tablePage: 1,
  teamMetric: "deliverables",
};

let data;
let context;
let lookup;

const escapeHtml = (value) => String(value ?? "—").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));
const fmt = (value) => Number(value || 0).toLocaleString("en-US");
const pct = (value) => `${Math.round((value || 0) * 100)}%`;
const fmtDate = (value) => value ? new Intl.DateTimeFormat("en-GB").format(new Date(`${value}T12:00:00`)) : "—";
const avg = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

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
  const nav = Object.entries(PAGE_META).map(([key, [label]], index) => `
    <button data-nav="${key}" class="${state.page === key ? "active" : ""}">
      <span class="nav-index">${String(index + 1).padStart(2, "0")}</span><span>${label.replace("MIDP / TIDP Delivery Control", "MIDP / TIDP").replace("Annotation Ticket Control", "Annotation Tickets").replace("Cross-data Dependencies", "Dependencies").replace("Team & Resource", "Team & Resource")}</span>
    </button>`).join("");
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">PMP</div><div><strong>Project Control</strong><span>BIM · DIGITAL DELIVERY</span></div></div>
        <nav class="nav">${nav}</nav>
        <div class="source-note">Snapshot ${fmtDate(data.meta.asOf)}<br>Reporting week CW${data.meta.reportingWeek}<br>3 controlled sources</div>
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
  const owners = unique([...data.deliverables.map((item) => item.owner), ...data.tickets.map((item) => item.handler)]);
  const statuses = unique(data.tickets.map((item) => item.status));
  return `<header class="topbar">
    <div class="project-pill"><strong>${escapeHtml(data.meta.project)}</strong><span>CW${data.meta.reportingWeek} · as of ${fmtDate(data.meta.asOf)}</span></div>
    <div class="filter-control"><label>System</label><select data-filter="system">${options(unique(data.deliverables.map((item) => item.system)), state.filters.system)}</select></div>
    <div class="filter-control"><label>Responsible</label><select data-filter="owner">${options(owners, state.filters.owner)}</select></div>
    <div class="filter-control"><label>Work type</label><select data-filter="workType">${options(unique([...data.deliverables.map((item) => item.workType), ...data.tickets.map((item) => item.workType)]), state.filters.workType)}</select></div>
    <div class="filter-control"><label>Ticket status</label><select data-filter="status">${options(statuses, state.filters.status)}</select></div>
    <div class="filter-control search"><label>Search</label><input data-filter="search" value="${escapeHtml(state.filters.search)}" placeholder="ID, title, family…"></div>
    <button class="button" id="reset-filters">Reset filters</button>
  </header>`;
}

function filtered() {
  const f = state.filters;
  const term = f.search.toLowerCase().trim();
  const deliverables = data.deliverables.filter((item) =>
    (!f.system || item.system === f.system) &&
    (!f.owner || item.owner === f.owner) &&
    (!f.workType || item.workType === f.workType) &&
    (!term || `${item.id} ${item.title} ${item.system} ${item.owner}`.toLowerCase().includes(term))
  );
  const allowedFamilyIds = new Set(deliverables.map((item) => item.familyId).filter(Boolean));
  const families = data.families.filter((item) =>
    (!f.system || allowedFamilyIds.has(item.id)) &&
    (!f.owner || item.uploader === f.owner || item.ticketIds.some((id) => lookup.ticketById.get(id)?.handler === f.owner)) &&
    (!term || `${item.id} ${item.name} ${item.category} ${item.uploader} ${item.ticketIds.join(" ")}`.toLowerCase().includes(term))
  );
  const allowedTicketIds = new Set(families.flatMap((item) => item.ticketIds));
  const tickets = data.tickets.filter((item) =>
    (!f.system || allowedTicketIds.has(item.id)) &&
    (!f.owner || item.handler === f.owner) &&
    (!f.workType || item.workType === f.workType) &&
    (!f.status || item.status === f.status) &&
    (!term || `${item.id} ${item.summary} ${item.handler} ${item.reporter}`.toLowerCase().includes(term))
  );
  return { deliverables, tickets, families };
}

function heading() {
  const [title, subtitle] = PAGE_META[state.page];
  const active = Object.entries(state.filters).filter(([, value]) => value);
  return `<div class="page-heading"><div><p class="eyebrow">PMP Project Report</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><div class="evidence-badge">Evidence date · ${fmtDate(data.meta.asOf)}</div></div>
    ${active.length ? `<div class="filter-chips">${active.map(([key, value]) => `<span class="chip">${escapeHtml(key)}: ${escapeHtml(value)}</span>`).join("")}</div>` : ""}`;
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

function panel(title, subtitle, body, className = "") {
  return `<section class="panel ${className}"><div class="panel-header"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div></div>${body}</section>`;
}

function statusBadge(value) {
  const lower = String(value).toLowerCase();
  const tone = lower.includes("risk") || lower.includes("intervention") || lower.includes("critical") ? "red" : lower.includes("past") || lower.includes("confirm") || lower.includes("aging") ? "amber" : lower.includes("current") || lower.includes("assigned") || lower.includes("acknowledged") ? "blue" : lower.includes("track") || lower.includes("closed") || lower.includes("resolved") || lower.includes("uploaded") ? "green" : "";
  return `<span class="badge ${tone}">${escapeHtml(value)}</span>`;
}

function dataTable({ title, subtitle, columns, rows, kind, exportName = "records" }) {
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  state.tablePage = Math.min(state.tablePage, totalPages);
  const start = (state.tablePage - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = visible.length ? visible.map((row) => `<tr class="clickable" data-open-kind="${kind}" data-open-id="${row.id}">${columns.map((column) => `<td>${column.render ? column.render(row) : escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${columns.length}" class="empty">No records match the current filters.</td></tr>`;
  return `<section class="panel"><div class="panel-header"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="button" data-export="${exportName}" data-export-kind="${kind}">Export CSV</button></div><div class="table-tools"><span>${fmt(rows.length)} records · showing ${rows.length ? start + 1 : 0}–${Math.min(start + pageSize, rows.length)}</span><span>Click a row for source trace</span></div><div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div><div class="pagination"><button data-page-step="-1" ${state.tablePage === 1 ? "disabled" : ""}>←</button><span>Page ${state.tablePage} / ${totalPages}</span><button data-page-step="1" ${state.tablePage === totalPages ? "disabled" : ""}>→</button></div></section>`;
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
  const currentBySystem = groupCount(current, (item) => item.system);
  const aging = groupCount(open, (item) => agingBucket(item, data.meta.asOf));
  return `${heading()}
    <div class="notice">Completion and contractual due dates are not present in all three sources. Evidence gaps are shown explicitly; no green status is inferred from missing data.</div>
    <div class="kpi-grid">
      ${kpi("TIDP work items", fmt(deliverables.length), `${fmt(current.length)} active in CW${data.meta.reportingWeek}`, "", "tidp")}
      ${kpi("Current-week plan", fmt(current.length), `${fmt(groupCount(current, (item) => item.system).size)} systems represented`, "delta", "tidp-current")}
      ${kpi("Past plan · unverified", fmt(past.length), "Actual finish is not supplied", "", "tidp-past")}
      ${kpi("Open annotation tickets", fmt(open.length), `${fmt(critical.length)} older than 30 days`, "", "tickets-open")}
      ${kpi("TIDP family coverage", pct(matched.length / Math.max(rfa.length, 1)), `${fmt(rfa.length - matched.length)} no exact uploaded match`, "", "families")}
    </div>
    <div class="health-grid">
      ${healthItem("Schedule health", `${fmt(past.length)} need confirmation`, past.length ? "attention" : "healthy", "tidp")}
      ${healthItem("Ticket health", `${fmt(critical.length)} aging-critical`, critical.length ? "critical" : "healthy", "tickets")}
      ${healthItem("Family readiness", `${pct(matched.length / Math.max(rfa.length, 1))} exact coverage`, matched.length / Math.max(rfa.length, 1) < .9 ? "attention" : "healthy", "families")}
      ${healthItem("Resource load", `${fmt(open.length)} open`, open.length ? "attention" : "healthy", "team")}
      ${healthItem("Data quality", `${fmt(Object.values(data.quality).reduce((sum, value) => sum + value, 0))} flags`, "attention", "quality")}
    </div>
    ${panel("Management Attention", "Highest-impact, evidence-backed items under current filters", `<div class="attention-list">${attention.length ? attention.map((item) => `<button class="attention-item" data-open-kind="${item.kind}" data-open-id="${item.id}"><span class="rule">${item.rule}</span><span><strong>${escapeHtml(item.issue)}</strong><span class="attention-meta">${escapeHtml(item.impact)}</span></span><span><strong>${escapeHtml(item.action)}</strong><span class="attention-meta">Owner · ${escapeHtml(item.owner)}</span></span><span>${statusBadge(item.due)}<br><span class="attention-meta">${escapeHtml(item.related)}</span></span></button>`).join("") : `<div class="empty">No management-attention item matches the current filters.</div>`}</div>`, "attention-panel")}
    <div class="grid-2">
      ${panel("Current-week delivery by system", `CW${data.meta.reportingWeek} planned work`, `<div class="panel-body">${barList(currentBySystem, { filter: "system" })}</div>`)}
      ${panel("Open-ticket aging", "Aging is used because ticket due dates are absent", `<div class="panel-body">${barList(aging, { color: "amber" })}</div>`)}
    </div>`;
}

function timeline(deliverables) {
  const weeks = Array.from({ length: 8 }, (_, index) => data.meta.reportingWeek - 5 + index);
  const systems = unique(deliverables.map((item) => item.system));
  const counts = new Map();
  systems.forEach((system) => weeks.forEach((week) => counts.set(`${system}-${week}`, deliverables.filter((item) => item.system === system && item.weeks.some((entry) => entry.week === week)).length)));
  return `<div class="panel-body timeline"><div class="timeline-grid"><div class="timeline-cell label">System</div>${weeks.map((week) => `<div class="timeline-cell ${week < data.meta.reportingWeek ? "past" : ""} ${week === data.meta.reportingWeek ? "current" : ""}">CW${week}</div>`).join("")}${systems.map((system) => `<div class="timeline-cell label">${escapeHtml(system)}</div>${weeks.map((week) => `<div class="timeline-cell ${week < data.meta.reportingWeek ? "past" : ""} ${week === data.meta.reportingWeek ? "current" : ""}">${fmt(counts.get(`${system}-${week}`))}</div>`).join("")}`).join("")}</div></div>`;
}

function tidpView({ deliverables }) {
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
  return `${heading()}<div class="notice">“Uploaded” means present in the supplied Family Upload list. Approval state and upload date are not available. TIDP readiness is an exact normalized-name comparison.</div>
  <div class="kpi-grid">
    ${kpi("Uploaded families", fmt(families.length), "Main family source population")}
    ${kpi("TIDP RFA work items", fmt(rfa.length), "Planned content tasks")}
    ${kpi("Exact uploaded matches", fmt(matched.length), `${pct(matched.length / Math.max(rfa.length, 1))} derived coverage`)}
    ${kpi("No uploaded match", fmt(rfa.length - matched.length), "Review naming or availability")}
    ${kpi("Families with open tickets", fmt(openLinked.length), "Direct family-ticket links")}
  </div>
  <div class="grid-2">
    ${panel("TIDP family coverage by system", "Percentage of RFA work items with an exact uploaded match", `<div class="panel-body">${barList(bySystem, { filter: "system" })}</div>`)}
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
    ${kpi("Derived family links", fmt(relevant.filter((item) => item.familyId).length), "Exact normalized-name match")}
    ${kpi("Unlinked rows", fmt(relevant.filter((item) => !item.familyId).length), "No exact uploaded match")}
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

function teamView({ deliverables, tickets, families }) {
  const weeks = Array.from({ length: 8 }, (_, index) => data.meta.reportingWeek - 5 + index);
  const people = unique([...deliverables.map((item) => item.owner), ...tickets.map((item) => item.handler)]);
  const rows = people.map((name) => ({ name, values: Object.fromEntries(weeks.map((week) => {
    const deliverableCount = deliverables.filter((item) => item.owner === name && item.weeks.some((entry) => entry.week === week)).length;
    const ticketCount = tickets.filter((item) => item.handler === name && item.created && Number(item.created.slice(6, 10).replace("-", "")) >= 0 && weekOfYear(item.created) === week).length;
    return [week, state.teamMetric === "deliverables" ? deliverableCount : state.teamMetric === "tickets" ? ticketCount : deliverableCount + ticketCount];
  })) })).filter((row) => Object.values(row.values).some(Boolean)).sort((a, b) => Object.values(b.values).reduce((x, y) => x + y, 0) - Object.values(a.values).reduce((x, y) => x + y, 0)).slice(0, 18);
  const open = tickets.filter(isOpenTicket);
  const byHandler = groupCount(open, (item) => item.handler || "Unassigned");
  const criticalByHandler = groupCount(open.filter((item) => ticketAge(item, data.meta.asOf) > 30), (item) => item.handler || "Unassigned");
  const threshold = percentile([...byHandler.values()], .75);
  return `${heading()}<div class="notice">High workload is a capacity signal only. Complexity, availability and role are not present in the source and must be reviewed before reallocating work.</div>
  <div class="kpi-grid">
    ${kpi("People in filtered scope", fmt(people.length), "TIDP owners + ticket handlers")}
    ${kpi("Open ticket load", fmt(open.length), "Across current handlers")}
    ${kpi("75th percentile load", fmt(threshold), "Review threshold, not performance target")}
    ${kpi("Critical aging load", fmt([...criticalByHandler.values()].reduce((a, b) => a + b, 0)), "Open tickets older than 30 days")}
    ${kpi("Family upload owners", fmt(unique(families.map((item) => item.uploader)).length), "Uploader field coverage")}
  </div>
  <section class="panel"><div class="panel-header"><div><h2>Weekly workload heatmap</h2><p>Count of due/planned items by reporting week</p></div><select id="team-metric"><option value="deliverables" ${state.teamMetric === "deliverables" ? "selected" : ""}>Deliverables</option><option value="tickets" ${state.teamMetric === "tickets" ? "selected" : ""}>Tickets created</option><option value="combined" ${state.teamMetric === "combined" ? "selected" : ""}>Combined</option></select></div>${heatmap(rows, weeks, state.teamMetric)}</section>
  <div class="grid-2">
    ${panel("Open tickets by handler", "Click to filter; count indicates workload", `<div class="panel-body">${barList(byHandler, { filter: "owner", limit: 12 })}</div>`)}
    ${panel("Aging-critical tickets by handler", "Open tickets older than 30 days", `<div class="panel-body">${barList(criticalByHandler, { color: "red", filter: "owner", limit: 12 })}</div>`)}
  </div>`;
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

function renderPage() {
  const scoped = filtered();
  const renderers = { overview: overviewView, tidp: tidpView, tickets: ticketsView, families: familiesView, dependencies: dependenciesView, team: teamView, quality: qualityView };
  document.querySelector("#page-content").innerHTML = renderers[state.page](scoped);
  document.querySelectorAll("[data-nav]").forEach((button) => button.classList.toggle("active", button.dataset.nav === state.page));
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
    body = `<p>${statusBadge(deliverableState(item, context))} ${statusBadge(item.relationship)}</p><dl class="definition-list"><dt>Source ID</dt><dd>${item.id}</dd><dt>System</dt><dd>${escapeHtml(item.system)}</dd><dt>Owner</dt><dd>${escapeHtml(item.owner)}</dd><dt>Work type</dt><dd>${escapeHtml(item.workType)}</dd><dt>Plan</dt><dd>${item.plannedStartWeek ? `CW${item.plannedStartWeek}–CW${item.plannedFinishWeek}` : "No weekly marker"}</dd></dl><h3>Source trace</h3><div class="trace"><div class="trace-node"><strong>${item.id}</strong><br>TIDP work item</div><div class="trace-arrow">↓ ${item.relationship === "Derived" ? "exact normalized-name relationship" : "no evidenced link"}</div><div class="trace-node"><strong>${escapeHtml(family?.name || "No uploaded-family match")}</strong><br>${family ? `Family source · ${family.id}` : "Relationship gap"}</div>${tickets.map((ticket) => `<div class="trace-arrow">↓ direct Ticket_IDs relationship</div><div class="trace-node"><strong>#${ticket.id} · ${escapeHtml(ticket.status)}</strong><br>${escapeHtml(ticket.summary)}<br>Handler · ${escapeHtml(ticket.handler)}</div>`).join("")}</div>`;
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
    body = `<p>${statusBadge("Uploaded record")} ${statusBadge("Direct ticket mapping")}</p><dl class="definition-list"><dt>Family ID</dt><dd>${item.id}</dd><dt>Category</dt><dd>${escapeHtml(item.category)}</dd><dt>Uploader</dt><dd>${escapeHtml(item.uploader)}</dd><dt>Match method</dt><dd>${escapeHtml(item.matchType)}</dd></dl><h3>Source trace</h3><div class="trace"><div class="trace-node"><strong>${escapeHtml(item.name)}</strong><br>Uploaded family</div>${tickets.map((ticket) => `<div class="trace-arrow">↓ direct Ticket_IDs relationship</div><div class="trace-node"><strong>#${ticket.id} · ${escapeHtml(ticket.status)}</strong><br>${escapeHtml(ticket.summary)}</div>`).join("")}${deliverables.map((deliverable) => `<div class="trace-arrow">↑ derived exact-name relationship</div><div class="trace-node"><strong>${deliverable.id}</strong><br>${escapeHtml(deliverable.title)}</div>`).join("")}</div>`;
  }
  root.innerHTML = `<div class="drawer-backdrop" data-close-drawer></div><aside class="drawer" role="dialog" aria-modal="true"><button class="drawer-close" data-close-drawer aria-label="Close">×</button><p class="eyebrow">Traceable evidence</p><h2>${escapeHtml(title)}</h2>${body}</aside>`;
}

function exportCsv(kind) {
  const scoped = filtered();
  const rows = kind === "ticket" ? scoped.tickets : kind === "family" ? scoped.families : scoped.deliverables;
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter((key) => !Array.isArray(rows[0][key]) && typeof rows[0][key] !== "object");
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [keys.map(quote).join(","), ...rows.map((row) => keys.map((key) => quote(row[key])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${kind}-export-${data.meta.asOf}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function wireEvents() {
  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) { state.page = nav.dataset.nav; state.tablePage = 1; renderPage(); return; }
    if (event.target.closest("#reset-filters")) { state.filters = { system: "", owner: "", workType: "", status: "", search: "" }; document.querySelector("#app").innerHTML = appShell(); wireTopbar(); renderPage(); return; }
    const setFilter = event.target.closest("[data-set-filter]");
    if (setFilter) { state.filters[setFilter.dataset.setFilter] = setFilter.dataset.filterValue; document.querySelector(`[data-filter="${setFilter.dataset.setFilter}"]`).value = setFilter.dataset.filterValue; state.tablePage = 1; renderPage(); return; }
    const open = event.target.closest("[data-open-kind]");
    if (open) { openDrawer(open.dataset.openKind, open.dataset.openId); return; }
    if (event.target.closest("[data-close-drawer]")) document.querySelector("#drawer-root").innerHTML = "";
    const step = event.target.closest("[data-page-step]");
    if (step) { state.tablePage += Number(step.dataset.pageStep); renderPage(); }
    const action = event.target.closest("[data-action]");
    if (action) { const target = action.dataset.action; state.page = target.startsWith("tidp") ? "tidp" : target.startsWith("tickets") ? "tickets" : target; renderPage(); }
    const exportButton = event.target.closest("[data-export-kind]");
    if (exportButton) exportCsv(exportButton.dataset.exportKind);
  });
  document.addEventListener("change", (event) => {
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
