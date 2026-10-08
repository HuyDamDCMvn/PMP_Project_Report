export function tidpOwnerSlices(records, uploadedIds) {
  const keys = new Map();
  for (const row of records) {
    if (!row.familyKey) continue;
    if (!keys.has(row.familyKey)) keys.set(row.familyKey, { ...row, owners: new Set() });
    keys.get(row.familyKey).owners.add(row.owner || 'Unassigned');
  }
  const groups = new Map();
  for (const row of keys.values()) {
    const status = uploadedIds.has(row.familyId) ? 'Uploaded' : 'No linked upload';
    const owner = row.owners.size === 1 ? [...row.owners][0] : 'Multiple owners';
    const key = JSON.stringify([status, owner]);
    if (!groups.has(key)) groups.set(key, { status, owner, rows: [] });
    groups.get(key).rows.push(row);
  }
  const colors = ['#1f5a94', '#7849a3', '#187e85', '#b26a00', '#596579', '#b42318'];
  const owners = [...new Set([...groups.values()].map(g => g.owner))].sort();
  return [...groups.values()].sort((a,b) => (a.status === 'Uploaded' ? 0 : 1) - (b.status === 'Uploaded' ? 0 : 1) || a.owner.localeCompare(b.owner)).map(g => ({ ...g, value: g.rows.length, color: colors[owners.indexOf(g.owner) % colors.length] }));
}

export function ownerBarsMarkup(slices, outside, esc, { statuses = ['Uploaded', 'No linked upload'], colors = ['green', 'amber'], detailPrefix = 'owner-ring', format = String, unit = '', filter = 'owner', label = value => value, showValues = true, segmentLabels = false } = {}) {
  const owners = [...new Set(slices.map(s => s.owner))].sort();
  const max = Math.max(1, ...owners.map(owner => slices.filter(s => s.owner === owner).reduce((sum,s) => sum+s.value,0)));
  if (!owners.length) return '<div class="panel-body owner-coverage-bars"><p class="empty">No related records match the current filters.</p></div>';
  return `<div class="panel-body owner-coverage-bars">${owners.map(owner => `<div class="owner-coverage-row"><button data-set-filter="${filter}" data-filter-value="${esc(owner)}" ${['Unknown owner', 'Multiple owners'].includes(owner) ? 'disabled' : ''}>${esc(label(owner))}</button><div><div class="owner-stack-track">${statuses.map((status, index) => {
    const i = slices.findIndex(s => s.owner === owner && s.status === status);
    const s = slices[i];
    return `<button class="owner-stack-segment ${segmentLabels ? "has-value-label" : ""}" style="width:${(s?.value || 0)/max*100}%;background:${colors[index].startsWith("var(") || colors[index].startsWith("#") ? colors[index] : `var(--${colors[index]})`}" data-midp-detail="${detailPrefix}:${i}" ${s?.value ? '' : 'disabled'} aria-label="${esc(label(owner))} · ${status}: ${format(s?.value || 0)}${unit}. Open details" title="${esc(label(owner))} · ${status}: ${format(s?.value || 0)}${unit}">${segmentLabels && s?.value ? `<span>${format(s.value)}</span>` : ""}</button>`;
  }).join('')}</div>${showValues ? `<div class="owner-stack-values">${statuses.map(status => `<span>${status}: <strong>${format(slices.find(s => s.owner === owner && s.status === status)?.value || 0)}</strong></span>`).join(' · ')} · Total: <strong>${format(slices.filter(s => s.owner === owner).reduce((sum,s) => sum+s.value,0))}</strong>${unit}</div>` : ""}</div></div>`).join('')}</div>`;
}

export function ticketReporterHours(tickets, classify, valueOf = ticket => Number(ticket.actualHours || 0)) {
  const groups = new Map();
  for (const ticket of tickets) {
    const status = classify(ticket);
    if (!['Positive', 'Negative'].includes(status)) continue;
    const owner = ticket.reporter || 'Unknown reporter';
    const key = JSON.stringify([owner, status]);
    if (!groups.has(key)) groups.set(key, { owner, status, value: 0, rows: [] });
    const group = groups.get(key);
    group.value += valueOf(ticket);
    group.rows.push(ticket);
  }
  return [...groups.values()];
}

export function familyOwnerStacks(families, systems, owners, statusesOf) {
  const groups = new Map();
  for (const family of families) {
    const system = systems.get(family.id);
    const owner = owners[system] || (system === 'Multiple systems' ? 'Multiple owners' : 'Unknown owner');
    for (const status of new Set(statusesOf(family))) {
      const key = JSON.stringify([owner, status]);
      if (!groups.has(key)) groups.set(key, { owner, status, rows: [], value: 0 });
      const group = groups.get(key);
      group.rows.push(family);
      group.value++;
    }
  }
  return [...groups.values()];
}
