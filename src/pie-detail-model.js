import { uploadedFamilyRows } from './family-outcomes.js';
export function uploadDetails(kind, scoped, asOf) {
  const uploaded = uploadedFamilyRows(scoped.families, asOf);
  if (kind === 'uploaded') return { rows: uploaded, columns: ['id','name','category','uploader','end'] };
  const planned = new Set(scoped.deliverables.filter(r=>r.workType==='Revise the RFA library' && r.familyKey).map(r=>r.familyKey)).size;
  return { rows: [{name:'Arithmetic balance, not an unmatched Family list',planned,uploaded:uploaded.length,balance:Math.max(0,planned-uploaded.length)}], columns:['name','planned','uploaded','balance'] };
}

export function progressDetails(meta, series, week, asOf) {
  const cutoff = meta.weekEnd(week) < asOf ? meta.weekEnd(week) : asOf;
  const dateField = series === 'MEP Transmittal' ? 'actualTrm' : 'actualCfm';
  return { rows: meta.rows.filter(r=>series === 'Plan' ? r.plannedStartWeek && r.plannedStartWeek <= week : r[dateField] && r[dateField] <= cutoff),
    columns: ['ticketId','title','system','owner','plannedStartWeek',dateField,'cfmKind','cfmCell'] };
}
