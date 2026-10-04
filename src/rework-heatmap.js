import { familyOutcome } from './family-outcomes.js';
export const SYSTEM_OWNERS = { 'ELT/MSR': 'Hanh Pham', RLT: 'Lam Truong', SAN: 'Thuong Huynh', 'SPR MED': 'Sang Duong', HKG: 'Nhut Le' };

// Use the approved Family-to-TIDP links, never infer systems from names or people.
export function familyErrorSystems(deliverables) {
  const map = new Map();
  for (const row of deliverables) {
    if (!row.familyId || !row.system) continue;
    if (!map.has(row.familyId)) map.set(row.familyId, new Set());
    map.get(row.familyId).add(row.system);
  }
  return new Map([...map].map(([id, systems]) => [id, systems.size === 1 ? [...systems][0] : 'Multiple systems']));
}

export function reworkHeatmap(families, systems) {
  const returned = families.filter(f => familyOutcome(f) === 'Returned');
  const types = [...new Set(returned.flatMap(f => f.reworkErrors || []))].sort();
  const names = [...new Set(returned.map(f => systems.get(f.id) || 'Unknown system'))].sort();
  return { types, rows: names.map(system => ({ system, cells: types.map(type => ({ type, families: returned.filter(f => (systems.get(f.id) || 'Unknown system') === system && f.reworkErrors?.includes(type)) })) })) };
}

export function renderReworkHeatmap({ families, systems, filters, panel, register, escapeHtml: esc, fmt, asOf }) {
  const model = reworkHeatmap(families, systems);
  const max = Math.max(1, ...model.rows.flatMap(r => r.cells.map(c => c.families.length)));
  const body = model.rows.length ? `<div class="panel-body heatmap error-heatmap" tabindex="0" role="region" aria-label="Error counts by system and error type"><div class="error-heatmap-grid" style="--error-columns:${model.types.length}"><strong>System / Error type</strong>${model.types.map(t => `<button data-set-filter="reworkError" data-filter-value="${esc(t)}">${esc(t.replaceAll('_', ' '))}</button>`).join('')}${model.rows.map((r, i) => `<button data-set-filter="errorSystem" data-filter-value="${esc(r.system)}" aria-pressed="${filters.errorSystem === r.system}">${esc(r.system)}<small class="system-owner">${esc(SYSTEM_OWNERS[r.system] || 'Owner not provided')}</small></button>${r.cells.map((c, j) => {
    const count = c.families.length;
    const id = `error-heatmap:${i}:${j}`;
    register(id, { title: `${r.system} · ${c.type}`, rows: c.families, columns: ['id', 'name', 'category', 'uploader', 'reworkOutcome', 'end'] });
    return `<div class="heat-cell level-${count ? Math.ceil(count / max * 4) : 0}"><button data-issue-detail="${id}" aria-label="Open evidence: ${esc(r.system)} / ${esc(c.type)}: ${count} error flags">${fmt(count)}</button></div>`;
  }).join('')}`).join('')}</div></div>` : '<div class="empty" role="status">No Returned Families match the current filters.</div>';
  return panel('Returned errors by System', '', body + `<details class="chart-source"><summary>Chart purpose and legend definitions</summary><p>Locate concentrations of returned-Family errors by System. Each source X counts once per Family and error type; a Family can have several types. Darker blue means more flags (0–${fmt(max)} in this scope). Source: Family_Upload_vs_Annotation_Tickets_Checked.xlsx / Family_vs_Tickets, project DCMvn_Annotation Project, uploaded Returned Families through ${esc(asOf)}. Systems follow approved links to DCMvn_TIDP_Combined_20260930.xlsx. Missing links remain Unknown system; conflicting systems remain Multiple systems and are counted once, not duplicated. Select a row or column to compose filters. Click a cell to open Family evidence without changing filters. Rebuild with npm run data:build.</p></details>`, 'issues-panel');
}
