import { issueMetrics, personName } from "./issues.js";
import { agingBucket } from "./domain.js";
import { familyOutcome, familyProductivity } from "./family-outcomes.js";

const FAMILY_COLUMNS = ["id", "name", "category", "uploader", "reworkOutcome", "ticketStatus", "end"];

// Grouping is presentation-only: reuse both existing renderers and their record IDs.
export function renderFamilyAnalysis(options) {
  const { heading, collapsed = {}, escapeHtml: esc } = options;
  const bodyOptions = { ...options, heading: () => "" };
  const groups = [
    { id: "issues", title: "Issues", layoutScope: "team", render: renderIssues },
    { id: "productivity", title: "Productivity", layoutScope: "productivity", render: renderProductivity },
  ];
  return heading() + groups.map(({ id, title, layoutScope, render }) =>
    `<details class="dashboard-group" data-collapse="group-${id}" data-layout-scope="${layoutScope}" ${collapsed[`group-${id}`] ? "" : "open"}>
      <summary aria-controls="group-${id}-body"><h2>${esc(title)}</h2><span class="group-expanded-label">Collapse</span><span class="group-collapsed-label">Expand</span></summary>
      <div id="group-${id}-body" class="dashboard-group-body">${render(bodyOptions)}</div>
    </details>`).join("");
}

function analyticalComponents({ filters, panel, escapeHtml: esc, fmt, register }) {
  const number = value => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  function evidence(id, title, rows, value, className = "issue-count", columns) {
    register(id, { title, rows, columns, source: "Family_Upload_vs_Annotation_Tickets_Checked.xlsx · Family_vs_Tickets; Annotation_Ticket_User_Matrix_Checked.xlsx · Matrix. Only uploaded DCMvn_Annotation Project Families through the snapshot and directly linked unique tickets. Rebuilt with npm run data:build. Hours are recorded ticket totals, not weekly allocations or individual efficiency." });
    return `<button class="${className}" data-issue-detail="${id}" ${rows.length ? "" : "disabled"} aria-label="${esc(`Open details: ${title}`)}">${value}</button>`;
  }
  function filter(key, value, label, className = "issue-filter") {
    const selected = filters[key] === value;
    return `<button class="${className}${selected ? " selected" : ""}" data-set-filter="${key}" data-filter-value="${esc(value)}" aria-pressed="${selected}">${esc(label)}</button>`;
  }
  function card(id, title, value, note, rows, tone, key, selection, columns) {
    return `<div class="issue-kpi">${evidence(id, title, rows, `<span class="kpi-label">${title}</span><strong class="kpi-value ${tone}">${value}</strong><span class="kpi-note">${note}</span>`, "issue-kpi-main", columns)}${key ? filter(key, selection, "Filter", "issue-kpi-filter") : ""}</div>`;
  }
  function breakdown({ id, title, subtitle, rows, dimension, tone = "blue", hours = false, label = value => value, columns }) {
    const groups = new Map();
    rows.forEach(row => {
      const key = row[dimension] || "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    const entries = [...groups].map(([key, records]) => ({ key, records, value: hours ? records.reduce((sum, row) => sum + row.actualHours, 0) : records.length })).sort((a, b) => b.value - a.value);
    const max = Math.max(1, ...entries.map(entry => entry.value));
    const dimensionFilter = dimension === "handler" ? "owner" : dimension;
    return panel(title, subtitle, `<div class="panel-body issue-breakdown">${entries.map((entry, i) => `<div class="issue-breakdown-row">
      ${filter(dimensionFilter, entry.key, label(entry.key), "issue-label")}
      <button class="issue-bar-track${filters[dimensionFilter] === entry.key ? " selected" : ""}" data-set-filter="${dimensionFilter}" data-filter-value="${esc(entry.key)}" aria-pressed="${filters[dimensionFilter] === entry.key}" aria-label="${esc(`Filter ${label(entry.key)}`)}"><span class="issue-bar ${tone}" style="width:${entry.value / max * 100}%"></span></button>
      ${evidence(`${id}:${i}`, `${title} · ${label(entry.key)}`, entry.records, `${number(entry.value)}${hours ? " h" : ""}`, "issue-count", columns)}
    </div>`).join("") || '<div class="empty">No linked records match the current filters.</div>'}</div>`, "issues-panel");
  }
  function weekly({ id, title, weeks, series, dimension, columns }) {
    const max = Math.max(1, ...weeks.flatMap(week => series.map(s => week[s.field].length)));
    return `<div class="panel-body"><div class="issue-legend">${series.map(s => `<span><i class="${s.tone}"></i>${esc(s.label)}</span>`).join("")}<span>Click a week to filter; click a count for records.</span></div>
      <div class="issue-week-scroll" tabindex="0" aria-label="${esc(title)}"><div class="issue-weeks">${weeks.map(week => `<div class="issue-week${week === weeks.at(-1) ? " current" : ""}">
        <div class="issue-week-bars">${series.map(s => { const rows = week[s.field]; return `<div class="issue-week-series">${evidence(`${id}:${week.key}:${s.field}`, `${s.label} · ${week.key}`, rows, fmt(rows.length), "issue-count", columns)}<button class="issue-week-bar ${s.tone}${filters[dimension] === week.key ? " selected" : ""}" style="height:${rows.length / max * 140}px" data-set-filter="${dimension}" data-filter-value="${week.key}" aria-pressed="${filters[dimension] === week.key}" aria-label="${esc(`Filter ${week.key}: ${s.label}`)}" title="${esc(s.label)}: ${rows.length}"></button></div>`; }).join("")}</div>
        ${filter(dimension, week.key, week.label, "issue-week-label")}<span class="cell-muted">${week === weeks.at(-1) ? "To snapshot" : week.key.slice(0, 4)}</span>
      </div>`).join("")}</div></div></div>`;
  }
  return { evidence, filter, card, breakdown, weekly, number };
}

export function renderIssues(options) {
  const { tickets, families, familyChart, asOf, panel, heading, fmt, fmtDate } = options;
  const { evidence, filter, card, breakdown, weekly } = analyticalComponents(options);
  const m = issueMetrics(tickets, asOf);
  const current = m.weeks.at(-1);
  const returned = families.filter(family => familyOutcome(family) === "Returned");
  const agingBody = `<div class="panel-body issue-aging">${["0–3 days", "4–7 days", "8–14 days", "15–30 days", ">30 days", "Unknown"].map((bucket, i) => {
    const rows = m.open.filter(ticket => agingBucket(ticket, asOf) === bucket);
    return `<div class="issue-aging-item${bucket === ">30 days" ? " critical" : ""}">${filter("aging", bucket, bucket)}${evidence(`issues:aging:${i}`, `Open issues · ${bucket}`, rows, fmt(rows.length))}</div>`;
  }).join("")}</div>`;
  return `${heading()}
    ${families.length ? "" : '<div class="empty" role="status">No uploaded Families match the current filters. Remove a filter or use Reset Filters.</div>'}
    ${panel("Issue pulse", `Uploaded Families only · snapshot ${fmtDate(asOf)}`, `<div class="panel-body issue-kpis">
      ${card("issues:returned", "Returned Families", fmt(returned.length), "Source rework outcome", returned, "red", "familyOutcome", "Returned", FAMILY_COLUMNS)}
      ${card("issues:open", "Open issues", fmt(m.open.length), "New · acknowledged · assigned", m.open, "amber", "issueState", "Open")}
      ${card("issues:critical", "Open >30 days", fmt(m.critical.length), "Age since Created Date", m.critical, "red", "aging", ">30 days")}
      ${card("issues:current", `Completed ${current.label}`, fmt(current.completed.length), "Resolved / closed · End Date", current.completed, "green", "activityWeek", current.key)}
    </div>`, "issues-panel")}
    ${familyChart}
    ${panel("Weekly linked issues", "Last 8 ISO weeks · Created Date vs End Date · current week is partial", weekly({ id: "issues:weekly", title: "Weekly linked issues", weeks: m.weeks, dimension: "activityWeek", series: [{ field: "created", label: "Created", tone: "blue" }, { field: "completed", label: "Completed", tone: "green" }] }), "issues-panel")}
    <div class="grid-2">
      ${panel("Open issue aging", "Calendar days since creation at the reporting snapshot", agingBody, "issues-panel")}
      ${breakdown({ id: "issues:status", title: "Issue status", subtitle: "Select a status to filter the dashboard", rows: tickets, dimension: "status" })}
      ${breakdown({ id: "issues:handlers", title: "Open issues by handler", subtitle: "Work queue · select a handler to focus", rows: m.open, dimension: "handler", tone: "amber", label: personName })}
    </div>`;
}

export function renderProductivity(options) {
  const { families, tickets, asOf, panel, heading, fmt, fmtDate } = options;
  const { card, breakdown, weekly, number } = analyticalComponents(options);
  const m = familyProductivity(families, tickets, asOf);
  const current = m.weeks.at(-1);
  return `${heading()}
    ${m.families.length ? "" : '<div class="empty" role="status">No uploaded Families match the current filters. Remove a filter or use Reset Filters.</div>'}
    ${panel("Family output", `Uploaded Families only · snapshot ${fmtDate(asOf)}`, `<div class="panel-body issue-kpis">
      ${card("productivity:families", "Uploaded Families", fmt(m.families.length), "Unique Families through snapshot", m.families, "blue", null, null, FAMILY_COLUMNS)}
      ${card("productivity:current", `Uploaded ${current.label}`, fmt(current.uploaded.length), "Family End Date · partial week", current.uploaded, "green", "uploadWeek", current.key, FAMILY_COLUMNS)}
      ${card("productivity:pass", "One-pass rate", m.onePassRate === null ? "—" : `${number(m.onePassRate * 100)}%`, `${fmt(m.onePass.length)} / ${fmt(m.families.length)} uploaded Families`, m.onePass, "green", "familyOutcome", "One pass", FAMILY_COLUMNS)}
      ${card("productivity:hours", "Linked recorded effort", m.issues.hoursRows.length ? `${number(m.issues.hours)} h` : "—", `${fmt(m.issues.hoursRows.length)} unique tickets with hours · ${m.tickets.length - m.issues.hoursRows.length} missing`, m.issues.hoursRows, "blue")}
    </div>`, "issues-panel")}
    ${panel("Weekly Family uploads", "Families per ISO week · Family End Date · last 8 weeks", weekly({ id: "productivity:weekly", title: "Weekly Family uploads", weeks: m.weeks, dimension: "uploadWeek", columns: FAMILY_COLUMNS, series: [{ field: "uploaded", label: "Uploaded Families", tone: "green" }] }), "issues-panel")}
    <div class="grid-2">
      ${breakdown({ id: "productivity:uploaders", title: "Uploaded Families by uploader", subtitle: "Family counts · not an individual efficiency ranking", rows: m.families, dimension: "uploader", label: personName, columns: FAMILY_COLUMNS })}
      ${breakdown({ id: "productivity:effort", title: "Linked effort by handler", subtitle: "Total recorded hours · not allocated to upload weeks", rows: m.issues.hoursRows, dimension: "handler", label: personName, hours: true })}
    </div>`;
}
