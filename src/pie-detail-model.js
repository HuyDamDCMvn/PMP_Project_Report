import { uploadedFamilyRows } from './family-outcomes.js';
export function uploadDetails(kind, scoped, asOf) {
  const uploaded = uploadedFamilyRows(scoped.families, asOf);
  if (kind === 'uploaded') return { rows: uploaded, columns: ['id','name','category','uploader','end'] };
  if (kind === 'pending') {
    const ids = new Set(uploaded.map(f=>f.id));
    const groups = new Map();
    for (const r of scoped.deliverables.filter(r=>r.workType==='Revise the RFA library' && r.familyKey)) {
      if (!groups.has(r.familyKey)) groups.set(r.familyKey, []);
      groups.get(r.familyKey).push(r);
    }
    return { rows: [...groups.values()].filter(records=>!records.some(r=>ids.has(r.familyId))).map(records=>({
      title: records[0].title, familyKey: records[0].familyKey, system: [...new Set(records.map(r=>r.system))].join('; '), owner: [...new Set(records.map(r=>r.owner))].join('; '),
      plannedStartWeek: records.map(r=>r.plannedStartWeek).filter(Number.isFinite).sort((a,b)=>a-b)[0] ?? null,
      status: 'No linked upload in the selected evidence at snapshot'
    })), columns: ['title','system','owner','plannedStartWeek','status'] };
  }
  const planned = new Set(scoped.deliverables.filter(r=>r.workType==='Revise the RFA library' && r.familyKey).map(r=>r.familyKey)).size;
  return { rows: [{name:'Arithmetic balance, not an unmatched Family list',planned,uploaded:uploaded.length,balance:Math.max(0,planned-uploaded.length)}], columns:['name','planned','uploaded','balance'] };
}

export function progressDetails(meta, series, week, asOf) {
  const cutoff = meta.weekEnd(week) < asOf ? meta.weekEnd(week) : asOf;
  const dateField = series === 'MEP Transmittal' ? 'actualTrm' : 'actualCfm';
  return { rows: meta.rows.filter(r=>series === 'Plan' ? r.plannedStartWeek && r.plannedStartWeek <= week : r[dateField] && r[dateField] <= cutoff),
    columns: ['ticketId','title','system','owner','plannedStartWeek',dateField,'cfmKind','cfmCell'] };
}
