export function weeklyHours(dataset, tickets, selectedWeek = "") {
  const ids = new Set(tickets.filter(t => ["Positive", "Re-Assessment"].includes(t.active)).map(t => t.id));
  return Array.from({ length: 40 }, (_, i) => {
    const key = `2026-CW${String(i + 1).padStart(2, "0")}`;
    const entries = (dataset?.entries || []).filter(e => e.week === key && ids.has(e.ticketId) && (!selectedWeek || key === selectedWeek));
    return { key, value: entries.reduce((sum, e) => sum + e.hours, 0), entries };
  });
}

export function forecastWeeklyHours(weeks, asOf, selectedWeek = '') {
  if (selectedWeek) return { points: [], rate: null };
  const date = new Date(`${asOf}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return { points: [], rate: null };
  const thursday = new Date(date); thursday.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const week = Math.ceil(((thursday - new Date(Date.UTC(thursday.getUTCFullYear(),0,1))) / 86400000 + 1) / 7);
  const completed = date.getUTCDay() === 0 ? week : week - 1;
  const sample = weeks.filter(w=>Number(w.key.slice(-2)) >= 22 && Number(w.key.slice(-2)) <= 39 && Number(w.key.slice(-2)) !== 36 && Number(w.key.slice(-2)) <= completed);
  if (sample.length !== 17 || sample.some(w=>!Number.isFinite(w.value))) return { points: [], rate: null };
  const meanX = sample.reduce((sum,w)=>sum+Number(w.key.slice(-2)),0)/sample.length;
  const meanY = sample.reduce((sum,w)=>sum+w.value,0)/sample.length;
  const denominator = sample.reduce((sum,w)=>sum+(Number(w.key.slice(-2))-meanX)**2,0);
  if (!denominator) return { points: [], rate: null };
  const rate = sample.reduce((sum,w)=>sum+(Number(w.key.slice(-2))-meanX)*(w.value-meanY),0)/denominator;
  const intercept = meanY-rate*meanX;
  return { rate, intercept, points: Array.from({length:Math.min(3,53-week)},(_,i)=>({key:`2026-CW${String(week+i+1).padStart(2,'0')}`,value:Math.max(0,intercept+rate*(week+i+1)),entries:[]})) };
}

// Keep labels inside the plot (outside Y ticks) and resolve neighbouring boxes
// again after every scale change. Boxes include the full keyboard target.
export function placeWeeklyLabels(points, width, bottom) {
  const placed = [];
  return points.map(point => {
    if (point.empty) return { x: point.x - 35, y: 8 };
    const left = Math.max(96, Math.min(width - 76, point.x - 35));
    const preferred = Math.max(8, point.labelY ?? point.y - 58);
    const candidates = [preferred];
    for (let offset = 8; offset <= bottom; offset += 8) candidates.push(preferred - offset, preferred + offset);
    const top = candidates.find(y => y >= 8 && y + 44 <= bottom && !placed.some(box => left < box.x + 70 && left + 70 > box.x && y < box.y + 48 && y + 48 > box.y) && !points.some(p => !p.empty && p.x >= left - 8 && p.x <= left + 78 && p.y > y - 12 && p.y < y + 36)) ?? 8;
    const box = { x: left, y: top };
    placed.push(box);
    return box;
  });
}

export function weeklyMonthBands(weeks) {
  const bands = [];
  weeks.forEach((week, index) => {
    const match = /^(\d{4})-CW(\d{2})$/.exec(week.key);
    if (!match) return;
    const date = new Date(Date.UTC(Number(match[1]), 0, 4));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7) + (Number(match[2]) - 1) * 7);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const last = bands.at(-1);
    if (last?.key === key) last.end = index;
    else bands.push({ key, start: index, end: index, label: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) });
  });
  return bands;
}

export function renderWeeklyMonthRow(weeks, x, bottom) {
  return weeklyMonthBands(weeks).map(band => `<g class="progress-month"><line x1="${x(band.start)}" x2="${x(band.end)}" y1="${bottom + 57}" y2="${bottom + 57}" class="progress-grid"/><text x="${(x(band.start) + x(band.end)) / 2}" y="${bottom + 76}" text-anchor="middle">${band.label}</text></g>`).join('');
}

// Shared progress-style line primitive: presentation has no API or business rules.
export function renderWeeklySeries({ weeks, axisLabel, title, fmt, label, weekLabel, legend = "Hours spent / week", currentWeek = weeks.at(-1)?.key, weekSpacing = 50, minCanvasWidth = 1200, axis, showMonths = false, overlays = [], minPlotHeight = overlays.length ? 500 : 250, pointMarks = false }) {
  // Match Weekly Family uploads' canvas scale so identical SVG font sizes
  // remain visually identical when both charts fill the same panel width.
  const width = Math.max(minCanvasWidth, 150 + (weeks.length - 1) * weekSpacing);
  const values = [...weeks, ...overlays.flatMap(s => s.weeks)].map(w => w.value).filter(Number.isFinite);
  const highest = Math.max(1, ...values.map(Math.abs));
  const step = axis?.value || Math.max(0.25, 10 ** Math.floor(Math.log10(highest)) / 2);
  const max = Math.ceil(highest / step) * step;
  const min = Math.min(0, ...values);
  const low = Math.floor(min / step) * step;
  const x = i => 90 + i * (width - 150) / Math.max(1, weeks.length - 1);
  const bottom = 80 + Math.max(minPlotHeight, Math.round((max - low) / step) * 20);
  const y = v => bottom - (v - low) / (max - low) * (bottom - 80);
  const ticks = Array.from({ length: Math.round((max - low) / step) + 1 }, (_, i) => low + i * step);
  const segments = [];
  let segment = [];
  weeks.forEach((w, i) => {
    if (Number.isFinite(w.value)) segment.push(`${x(i)},${y(w.value)}`);
    else { if (segment.length) segments.push(segment); segment = []; }
  });
  if (segment.length) segments.push(segment);
  const labelPoints = weeks.map((w, i) => ({ x: x(i), y: y(w.value ?? 0), empty: !Number.isFinite(w.value) || !label(w) }));
  const overlayIndices = overlays.map(series => series.weeks.map((w, i) => {
    if (!Number.isFinite(w.value)) return null;
    const index = labelPoints.length;
    labelPoints.push({ x: x(i), y: y(w.value), labelY: y(w.value) - 58 });
    return index;
  }));
  const positions = placeWeeklyLabels(labelPoints, width, bottom);
  const monthRow = showMonths ? renderWeeklyMonthRow(weeks, x, bottom) : "";
  const overlayMarkup = overlays.map((series, seriesIndex) => {
    const paths = []; let points = [];
    series.weeks.forEach((w, i) => {
      if (Number.isFinite(w.value)) points.push(`${x(i)},${y(w.value)}`);
      else { if (points.length) paths.push(points); points = []; }
    });
    if (points.length) paths.push(points);
    return `<g class="role-series ${series.className}" ${series.color ? `style="--role-color:${series.color};stroke-dasharray:${series.dash || 'none'}"` : ''}>${paths.map(p => `<polyline points="${p.join(' ')}"/>`).join('')}${series.weeks.map((w, i) => {
      if (!Number.isFinite(w.value)) return '';
      const position = pointMarks ? { x: x(i) - 22, y: y(w.value) - 22 } : positions[overlayIndices[seriesIndex][i]];
      return `<circle cx="${x(i)}" cy="${y(w.value)}" r="4"/><foreignObject x="${position.x}" y="${position.y}" width="${pointMarks ? 44 : 70}" height="44">${series.mark(w)}</foreignObject>`;
    }).join('')}</g>`;
  }).join('');
  return `<div class="panel-body family-progress">${axis ? `<div class="weekly-chart-controls"><label class="progress-axis-control" for="${axis.id}">${axis.label}<input id="${axis.id}" data-weekly-axis="${axis.key}" type="number" min="${axis.min}" max="${axis.max}" step="${axis.increment}" value="${step}" /></label>${axis.controls || ""}</div>` : ""}${legend ? `<div class="progress-legend"><span class="actual">${legend}</span></div>` : ""}<div class="progress-scroll" tabindex="0" aria-label="${title}"><div class="upload-line-chart"><svg style="min-width:${width}px" viewBox="0 0 ${width} ${bottom + (showMonths ? 120 : 90)}" role="group" aria-label="${title}">
    ${ticks.map(v => `<line x1="90" x2="${width - 60}" y1="${y(v)}" y2="${y(v)}" class="progress-grid"/><text x="80" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join("")}
    ${weeks.map((w, i) => `<line x1="${x(i)}" x2="${x(i)}" y1="60" y2="${bottom}" class="${w.key === currentWeek ? "progress-current" : "progress-week-grid"}"/>`).join("")}
    ${segments.map(points => `<polyline points="${points.join(" ")}" class="progress-actual-line"/>`).join("")}
    ${overlayMarkup}
    ${weeks.map((w, i) => `${Number.isFinite(w.value) ? `<circle cx="${x(i)}" cy="${y(w.value)}" r="3" class="progress-actual"/>` : ""}<foreignObject x="${positions[i].x}" y="${positions[i].y}" width="70" height="44">${label(w)}</foreignObject><foreignObject x="${x(i) - 22}" y="${bottom + 10}" width="44" height="44">${weekLabel(w)}</foreignObject>`).join("")}
    ${monthRow}<text x="${width / 2}" y="${bottom + (showMonths ? 108 : 80)}" text-anchor="middle">CW · 2026</text><text x="20" y="${(bottom + 80) / 2}" transform="rotate(-90 20 ${(bottom + 80) / 2})" text-anchor="middle">${axisLabel}</text></svg></div></div></div>`;
}

export function renderWeeklyHours({ dataset, tickets, filters, panel, register, escapeHtml: esc, fmt, axisStep = 200 }) {
  const title = "Weekly Annotation Project hours";
  if (!dataset) return panel(title, "", '<div class="empty" role="status">Time-history data has not been generated. Run python scripts/build_weekly_hours.py.</div>', "issues-panel");
  const actualWeeks = weeklyHours(dataset, tickets, filters.spentWeek);
  const forecast = forecastWeeklyHours(actualWeeks, dataset.meta.asOf, filters.spentWeek);
  const weeks = [...actualWeeks, ...forecast.points.map(w=>({...w,value:null}))];
  const byId = new Map(tickets.map(t => [t.id, t]));
  const total = weeks.reduce((sum, w) => sum + w.value, 0);
  const problems = dataset.meta.failed + dataset.meta.unparsed;
  const body = renderWeeklySeries({ weeks, title, currentWeek: actualWeeks.at(-1).key, overlays: forecast.points.length ? [{ className: "hours-forecast", color: "var(--brown)", dash: "6 4", weeks: weeks.map(w=>forecast.points.find(p=>p.key===w.key) || (w.key===actualWeeks.at(-1).key ? {...w, forecastAnchor:true} : {...w,value:null})), mark: w=>w.forecastAnchor ? "" :`<span class="role-mark" style="cursor:default" aria-label="${w.key}: forecast ${fmt(w.value)} hours">${fmt(w.value)}</span>` }] : [], legend: forecast.points.length ? "Hours spent / week · dashed brown: Forecast" : "Hours spent / week", showMonths: true, axisLabel: "Hours spent / week", fmt, axis: { id: "hours-axis-step", key: "hoursAxisStep", label: "Y-axis step (hours)", min: 10, max: 5000, increment: 10, value: axisStep },
    label: w => {
      if (w.value === null) return "";
      const id = `spent:${w.key}`;
      const rows = w.entries.map(e => ({ ...byId.get(e.ticketId), actualHours: e.hours }));
      register(id, { title: `${title} · ${w.key} · net weekly hours`, rows, columns: ["id", "summary", "handler", "actualHours"], source: dataset.meta.rounding });
      return `<button class="issue-count" data-issue-detail="${id}" ${rows.length ? "" : "disabled"} aria-label="Open ${w.key}: ${fmt(w.value)} hours">${fmt(w.value)}</button>`;
    },
    weekLabel: w => `<span class="issue-week-label">${w.key.slice(-2)}</span>`,
  });
  const differences = (dataset.audit || []).filter(a => byId.has(a.ticketId) && a.difference !== null && Math.abs(a.difference) > 0.011).length;
  return panel(title, `Positive tickets · CW01–CW40 · ${fmt(total)} h`, `${problems ? `<p class="empty" role="status">Incomplete history: ${dataset.meta.failed} tickets unavailable; ${dataset.meta.unparsed} unrecognized events. Known hours only.</p>` : ""}${differences ? `<p class="cell-muted">History/workbook reconciliation: ${differences} tickets have different totals. History values shown; workbook KPIs unchanged.</p>` : ""}${tickets.some(t => ["Positive", "Re-Assessment"].includes(t.active)) ? body : '<div class="empty">No Positive tickets match the current filters.</div>'}<details class="chart-source"><summary>Chart purpose and parameters</summary><p>Purpose: track weekly project effort and identify changes in workload. The horizontal axis shows actual CW01–CW40 and up to three forecast weeks. Dashed brown Forecast fits ordinary least-squares linear regression to weekly hours from CW22–CW39, excluding CW36 as the user-designated outlier and excluding partial CW40. Forecast hours = max(0, fitted intercept + slope × week). The fitted line is extrapolated to CW41–CW43; a dashed connector starts at observed CW40 without changing the fitted predictions; it is an estimate, not recorded time or a completion prediction. It recalculates with ticket filters and is unavailable for a single spent-week selection. Forecast marks have no ticket detail action. Month groups use the Thursday of each ISO week, including weeks spanning two months; the vertical axis shows hours. Y-axis step controls grid spacing only. Blue values show hours spent in each ISO week, not cumulative hours. Added time is offset by deleted time using the work date in ticket history. Net hours are rounded down to 0.25 h per ticket/week before adding them. Positive includes Re-Assessment. The amber line marks partial CW40 through ${esc(dataset.meta.asOf)}; later edits and work dates are excluded. This project-wide chart includes tickets not linked to uploaded Families. Click a number for weekly ticket hours or a CW label to filter related records. Retrieved ${esc(dataset.meta.retrievedAt)}. Workbook total-hour KPIs remain unchanged. Snapshot cutoff uses the calendar date, not an exact 16:00 reconstruction.</p></details>`, "issues-panel");
}
