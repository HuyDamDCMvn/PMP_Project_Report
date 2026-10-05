import { issueMetrics, personName } from "./issues.js";
import { agingBucket } from "./domain.js";
import { familyOutcome, familyProductivity } from "./family-outcomes.js";
import { renderWeeklyMonthRow, renderWeeklySeries } from "./weekly-hours.js";
import { weeklyIssueSeries } from './weekly-errors.js';

const FAMILY_COLUMNS = ["id", "name", "category", "uploader", "reworkOutcome", "ticketStatus", "end"];

// Grouping is presentation-only: reuse both existing renderers and their record IDs.
export function renderFamilyAnalysis(options) {
  const { heading, collapsed = {}, escapeHtml: esc } = options;
  const bodyOptions = { ...options, heading: () => "" };
  const groups = [
    { id: "productivity", title: "Productivity", layoutScope: "productivity", render: renderProductivity },
    { id: "issues", title: "Issues", layoutScope: "team", render: renderIssues },
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
    return `<button class="${className}${selected ? " selected" : ""}" data-set-filter="${key}" data-filter-value="${esc(value)}" aria-pressed="${selected}" aria-label="${esc(label || `Filter ${value}`)}">${esc(label)}</button>`;
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
    const dimensionFilter = dimension;
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
  function weeklyLine({ id, title, weeks, dimension, columns, axisStep = 25, forecast = [] }) {
    const max = Math.max(axisStep, Math.ceil(Math.max(0, ...weeks.map(week => week.uploaded.length), ...forecast.map(point => point.value)) / axisStep) * axisStep);
    const canvasWidth = Math.max(1200, 150 + (weeks.length + forecast.length - 1) * 70);
    const x = i => 90 + i / Math.max(1, weeks.length + forecast.length - 1) * (canvasWidth - 150);
    const y = count => 330 - count / max * 250;
    const axisWeeks = [...weeks, ...forecast.map(p => ({ key: `${weeks.at(-1).key.slice(0, 4)}-CW${String(p.week).padStart(2, '0')}` }))];
    const monthRow = renderWeeklyMonthRow(axisWeeks, x, 330);
    const notes = [
      { key: '2026-CW30', text: 'Staff are being reassigned to the Miramas project.' },
      { key: '2026-CW36', text: 'Work from Munich RE and EKB has resumed.' },
    ];
    const annotations = notes.map((note, n) => {
      const i = weeks.findIndex(week => week.key === note.key);
      if (i < 0) return '';
      const cy = y(weeks[i].uploaded.length) + 22;
      return `<g class="upload-annotation" tabindex="0" role="img" aria-label="${esc(`${note.key}: ${note.text}`)}"><title>${esc(`${note.key}: ${note.text}`)}</title><line x1="${x(i)}" x2="${x(i)}" y1="${cy - 10}" y2="${cy - 20}"/><circle cx="${x(i)}" cy="${cy}" r="14"/><text x="${x(i)}" y="${cy + 5}" text-anchor="middle">${n + 1}</text></g>`;
    }).join('');
return `<div class="panel-body family-progress"><div class="progress-legend"><span class="actual">Actual uploads / week</span><span class="forecast">TIDP-linked upload forecast</span><span>Observed counts include all project uploads; the projection uses only TIDP-linked uploads.</span></div><label class="progress-axis-control" for="upload-axis-step">Y-axis step (families)<input id="upload-axis-step" type="number" min="10" max="5000" step="1" value="${axisStep}" /></label><div class="progress-scroll" tabindex="0" aria-label="${esc(title)}"><div class="upload-line-chart"><svg style="min-width:${canvasWidth}px" viewBox="0 0 ${canvasWidth} 450" role="group" aria-label="Weekly uploaded Family counts">${Array.from({ length: max / axisStep + 1 }, (_, i) => i * axisStep).map(tick => `<line x1="90" x2="${canvasWidth - 60}" y1="${y(tick)}" y2="${y(tick)}" class="progress-grid"/><text x="80" y="${y(tick) + 4}" text-anchor="end">${fmt(tick)}</text>`).join("")}${weeks.map((week, i) => `<line x1="${x(i)}" x2="${x(i)}" y1="60" y2="330" class="${week === weeks.at(-1) ? "progress-current" : "progress-week-grid"}"/>`).join("")}<polyline points="${weeks.map((week, i) => `${x(i)},${y(week.uploaded.length)}`).join(" ")}" class="progress-actual-line"/>${weeks.map((week, i) => `<foreignObject x="${x(i) - 35}" y="${y(week.uploaded.length) - (i % 2 ? 46 : 58)}" width="70" height="44">${evidence(`${id}:${week.key}:uploaded`, `Uploaded Families · ${week.key}`, week.uploaded, fmt(week.uploaded.length), "issue-count", columns)}</foreignObject><circle cx="${x(i)}" cy="${y(week.uploaded.length)}" r="3" class="progress-actual"/><foreignObject x="${x(i) - 45}" y="340" width="90" height="44">${filter(dimension, week.key, week.label.replace("CW", ""), "issue-week-label")}</foreignObject>`).join("")}${forecast.length ? `<polyline class="progress-forecast-line" points="${[[weeks.length - 1, weeks.at(-1).uploaded.length], ...forecast.map((p, i) => [weeks.length + i, p.value])].map(([i, v]) => `${x(i)},${y(v)}`).join(" ")}"/>${forecast.map((p, i) => `<circle cx="${x(weeks.length + i)}" cy="${y(p.value)}" r="4" class="progress-forecast-dot"/><text class="progress-value progress-forecast-label" x="${x(weeks.length + i)}" y="${y(p.value) - 20}" text-anchor="middle">${fmt(Math.round(p.value))}</text><text x="${x(weeks.length + i)}" y="365" text-anchor="middle">${p.week}</text>`).join("")}` : ""}${annotations}${monthRow}<text x="${canvasWidth / 2}" y="438" text-anchor="middle">CW · ${weeks.at(-1).key.slice(0, 4)}</text><text x="20" y="195" transform="rotate(-90 20 195)" text-anchor="middle">Uploaded Families / week</text></svg></div></div><div class="upload-context-notes" aria-label="Weekly upload context">${notes.map((note, n) => `<p><strong>${n + 1} · ${note.key.replace("2026-", "")}</strong> ${esc(note.text)}</p>`).join("")}</div></div>`;
  }
  return { evidence, filter, card, breakdown, weekly, weeklyLine, number };
}

export function renderIssues(options) {
  const { tickets, families, familyChart, returnedErrorChart = '', asOf, panel, heading, fmt } = options;
  const { evidence } = analyticalComponents(options);
  const series = weeklyIssueSeries(families, asOf);
  const visibleSeries = series.map((s, i) => ({ ...s, index: i })).filter(s => !(options.hiddenErrorSeries || []).includes(s.type));
  const pointMarks = !options.showIssueLabels;
  const chartWeeks = series[0].weeks.map(w => ({ key: w.key, value: null }));
  const line = renderWeeklySeries({ weeks: chartWeeks, title: 'Weekly linked issues', axisLabel: 'Error flags per week', fmt, showMonths: true, weekSpacing: 70, minCanvasWidth: 1760, minPlotHeight: 250, pointMarks, legend: '', axis: { id: 'issues-axis-step', key: 'issueAxisStep', label: 'Y-axis step (counts)', min: 1, max: 1000, increment: 1, value: options.issueAxisStep || 5, controls: `<button class="button" data-toggle-issue-labels aria-pressed="${Boolean(options.showIssueLabels)}">${options.showIssueLabels ? 'Hide' : 'Show'} numeric labels</button>` },
    label: () => '',
    weekLabel: w => `<span class="issue-week-label">${w.key.slice(-2)}</span>`,
    overlays: visibleSeries.map(s => ({ className: 'error-series', color: s.color, dash: s.dash, weeks: s.weeks, mark: w => evidence(`issues:errors:${s.index}:${w.key}`, `${s.type} · ${w.key} · ${w.value} ${s.unit}`, w.rows, fmt(w.value), pointMarks ? 'error-point-mark' : 'role-mark', s.type === 'Total issues' ? [...FAMILY_COLUMNS, 'errorType'] : FAMILY_COLUMNS).replace('<button ', `<button title="${options.escapeHtml(s.type)} · ${w.key}: ${w.value}" `) })) });
  const legend = `<div class="weekly-error-legend" aria-label="Show or hide error lines">${series.map(s => { const visible = !(options.hiddenErrorSeries || []).includes(s.type); return `<button data-toggle-error-series="${options.escapeHtml(s.type)}" aria-pressed="${visible}" aria-label="${visible ? 'Hide' : 'Show'} ${options.escapeHtml(s.type.replaceAll('_', ' '))} line"><svg viewBox="0 0 40 12" aria-hidden="true"><line x1="0" x2="40" y1="6" y2="6" stroke="${s.color}" stroke-width="3" stroke-dasharray="${s.dash}"/></svg>${options.escapeHtml(s.type.replaceAll('_', ' '))}<small>${visible ? 'Visible' : 'Hidden'}</small></button>`; }).join('')}</div>`;
  return heading() + familyChart + (options.returnedTicketChart || '') + returnedErrorChart + (options.errorHeatmap || '') + panel('Weekly linked issues', '', legend + (families.length ? line + (!visibleSeries.length ? '<p class="empty" role="status">All lines are hidden. Select a legend item to show a line.</p>' : '') : '<div class="empty" role="status">No uploaded Families match the current filters.</div>'), 'issues-panel');
}

export function renderProductivity(options) {
  const { families, tickets, asOf, panel, heading, fmt, fmtDate } = options;
  const { card, weeklyLine, number } = analyticalComponents(options);
  const m = familyProductivity(families, tickets, asOf, { startWeek: 20, planRows: options.forecastPlan });
  return `${heading()}
    ${m.families.length ? "" : '<div class="empty" role="status">No uploaded Families match the current filters. Remove a filter or use Reset Filters.</div>'}
    ${panel("Family output", `Uploaded Families only · snapshot ${fmtDate(asOf)}`, `<div class="panel-body issue-kpis">
      ${card("productivity:families", "Uploaded Families", fmt(m.families.length), "", m.families, "blue", null, null, FAMILY_COLUMNS)}
      ${card("productivity:daily", "Average uploads / day", m.uploadsPerDay === null ? "—" : `${number(m.uploadsPerDay)} Families/day`, "", m.families.map(family => ({ ...family, ticketId: (family.ticketIds || []).join(", ") || "—" })), "green", null, null, ["ticketId", ...FAMILY_COLUMNS.slice(1)])}
      ${card("productivity:average", "Average recorded hours / Family", m.hoursPerFamily === null ? "—" : `${number(m.hoursPerFamily)} h / Family`, "", m.issues.hoursRows, "green")}
      ${card("productivity:hours", "Linked recorded effort", m.issues.hoursRows.length ? `${number(m.issues.hours)} h` : "—", "", m.issues.hoursRows, "blue")}
    </div>`, "issues-panel")}
    ${panel("Weekly Family uploads", "", weeklyLine({ id: "productivity:weekly", title: "Weekly Family uploads", weeks: m.weeks, dimension: "uploadWeek", columns: FAMILY_COLUMNS, axisStep: options.uploadAxisStep, forecast: m.forecastWeeks }), "issues-panel")}
    ${options.uploaderChart || ""}
    ${options.weeklyHoursChart || ""}
    ${options.weeklyFamilyEffortChart || ""}`;
}


