// One planned confirmation milestone per normalized Family identity.
export function confirmedFamilyPlan(deliverables) {
  const names = new Map();
  for (const item of deliverables) {
    if (!item.familyKey || item.workType !== 'Revise the RFA library') continue;
    const weeks = (item.weeks || []).filter(w => String(w.activity).split(/\s*\|\s*/).includes('CFM')).map(w => w.week).filter(Number.isFinite);
    if (!weeks.length) continue;
    const first = Math.min(...weeks);
    const old = names.get(item.familyKey);
    names.set(item.familyKey, { first: Math.min(first, old?.first ?? first) });
  }
  return names;
}
