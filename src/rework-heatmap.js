import { familyOutcome } from './family-outcomes.js';
import { familyTicketRows } from './returned-tickets.js';
export const SYSTEM_OWNERS = { 'ELT/MSR': 'Hanh Pham', RLT: 'Lam Truong', SAN: 'Thuong Huynh', 'SPR MED': 'Sang Duong', HKG: 'Nhut Le' };

// Use the approved Family-to-TIDP links, never infer systems from names or people.
export function familyErrorSystems(deliverables, families = []) {
  const map = new Map();
  for (const row of deliverables) {
    if (!row.familyId || !row.system) continue;
    if (!map.has(row.familyId)) map.set(row.familyId, new Set());
    map.get(row.familyId).add(row.system);
  }
  // User-approved error responsibility assignment (06/10/2026), not a TIDP equivalence link.
  for (const family of families) {
    if (family.key === '420pfcsccapmapress' && family.ticketIds?.includes(72176)) map.set(family.id, new Set(['HKG']));
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
  const totalFlags = model.rows.reduce((sum,row)=>sum+row.cells.reduce((n,cell)=>n+cell.families.length,0),0);
  const byType = model.types.map((type,i)=>({type,count:model.rows.reduce((sum,row)=>sum+row.cells[i].families.length,0)})).sort((a,b)=>b.count-a.count);
  const bySystem = model.rows.map(row=>({system:row.system,count:row.cells.reduce((sum,cell)=>sum+cell.families.length,0)})).sort((a,b)=>b.count-a.count);
  const analysis = totalFlags ? `There are ${fmt(totalFlags)} error flags in the current selection. The most frequent error type is ${esc(byType[0].type.replaceAll('_',' '))} (${fmt(byType[0].count)}; ${(byType[0].count/totalFlags*100).toFixed(1)}%). ${esc(bySystem[0].system)} has the largest total (${fmt(bySystem[0].count)} error flags). Prioritize the darkest cells to identify recurring issues that need targeted checks. Counts show error volume; they do not measure error rates or individual performance.` : 'No returned-Family error flags match the current selection.';
  const max = Math.max(1, ...model.rows.flatMap(r => r.cells.map(c => c.families.length)));
  const totals = model.types.map((type, column) => {
    const rows = model.rows.flatMap(row => row.cells[column].families);
    const id = `error-heatmap:total:${column}`;
    register(id, { title: `Total · ${type}`, rows: familyTicketRows(rows), columns: ['ticketId', 'name', 'category', 'uploader', 'reworkOutcome', 'end'] });
    return `<div class="heat-cell error-total"><button data-issue-detail="${id}" aria-label="Open evidence: Total / ${esc(type)}: ${rows.length} error flags">${fmt(rows.length)}</button></div>`;
  }).join('');
  const body = model.rows.length ? `<div class="panel-body heatmap error-heatmap" tabindex="0" role="region" aria-label="Error counts by system and error type"><div class="error-heatmap-grid" style="--error-columns:${model.types.length}"><strong>System / Error type</strong>${model.types.map(t => `<button data-set-filter="reworkError" data-filter-value="${esc(t)}">${esc(t.replaceAll('_', ' '))}</button>`).join('')}${model.rows.map((r, i) => `<button data-set-filter="errorSystem" data-filter-value="${esc(r.system)}" aria-pressed="${filters.errorSystem === r.system}">${esc(r.system)}<small class="system-owner">${esc(SYSTEM_OWNERS[r.system] || 'Owner not provided')}</small></button>${r.cells.map((c, j) => {
    const count = c.families.length;
    const id = `error-heatmap:${i}:${j}`;
    register(id, { title: `${r.system} · ${c.type}`, rows: familyTicketRows(c.families), columns: ['ticketId', 'name', 'category', 'uploader', 'reworkOutcome', 'end'] });
    return `<div class="heat-cell level-${count ? Math.ceil(count / max * 4) : 0}"><button data-issue-detail="${id}" aria-label="Open evidence: ${esc(r.system)} / ${esc(c.type)}: ${count} error flags">${fmt(count)}</button></div>`;
  }).join('')}`).join('')}<strong class="error-total">Total</strong>${totals}</div></div>` : '<div class="empty" role="status">No Returned Families match the current filters.</div>';
  return panel('Returned errors by System', '', body + `<details class="chart-source"><summary>Chart explanation and analysis</summary><p>Rows represent Systems and their responsible owners; columns represent error types. Each cell counts affected returned Families for that System and error type. A Family is counted once per error type and can appear in several columns. Darker blue indicates a higher count within the current selection; a pale cell with zero means no recorded cases. The Total row sums each error type across all Systems. These totals count error flags, so they can exceed the number of distinct Families or tickets.</p><p>${analysis}</p><p>Select a System row or error-type column to filter the related dashboard views. Select a numbered cell to open its Family and Ticket ID details. Combine selections to investigate a specific issue; remove filter chips or use Reset Filters to return to the full view.</p></details>`, 'issues-panel');
}
