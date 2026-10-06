import { validSnapshotDate, isoWeekKey } from './issues.js';
export const requireValue = (condition,message) => { if (!condition) throw new Error(`Invalid bundle: ${message}`); };
const array = (value,label) => { requireValue(Array.isArray(value),label); return value; };
const finiteOrNull = value => value === null || (typeof value === 'number' && Number.isFinite(value));
const dateOrNull = value => value === null || validSnapshotDate(value,'9999-12-31');
function unique(rows,key,label) {
  const seen=new Set();
  for (const r of rows) {
    requireValue(r && typeof r==='object' && (typeof r[key]==='string' || Number.isInteger(r[key])),label);
    requireValue(!seen.has(r[key]),`duplicate ${label}`); seen.add(r[key]);
  }
  return seen;
}
export function validateBundle(bundle) {
  const {data,familyRoleHours,timeHistory,manifest}=bundle;
  requireValue(manifest?.schemaVersion===1 && /^[a-f0-9]{64}$/.test(manifest.releaseId),'manifest version/release');
  requireValue(validSnapshotDate(manifest.asOf,'9999-12-31'),'snapshot date');
  for (const d of [data,familyRoleHours,timeHistory]) requireValue(d?.meta?.schemaVersion===1 && d.meta.releaseId===manifest.releaseId && d.meta.asOf===manifest.asOf,'dataset release/snapshot');
  const tickets=array(data.tickets,'tickets'), families=array(data.families,'families'), plan=array(data.deliverables,'deliverables');
  for (const t of tickets) requireValue(Number.isInteger(t?.id),'ticket integer ID');
  for (const r of [...families,...plan]) requireValue(typeof r?.id==='string' && r.id.trim(),'Family/Plan string ID');
  const tids=unique(tickets,'id','ticket ID'), fids=unique(families,'id','Family ID'); unique(plan,'id','TIDP ID');
  requireValue(Number.isInteger(data.meta.reportingWeek) && data.meta.reportingWeek>=1 && data.meta.reportingWeek<=53 && data.config && data.quality,'main metadata');
  requireValue(isoWeekKey(data.meta.asOf)?.startsWith('2026-CW'),'unsupported snapshot ISO year');
  requireValue(data.meta.reportingWeek===Number(isoWeekKey(data.meta.asOf).slice(-2)),'reportingWeek snapshot mismatch');
  const ticketById=new Map(tickets.map(t=>[t.id,t]));
  const familyById=new Map(families.map(f=>[f.id,f]));
  const reviews=array(data.qualityRecords,'qualityRecords'); unique(reviews,'id','QA ID');
  for (const q of reviews) {
    requireValue(fids.has(q.familyId) && (q.ticketId===null || tids.has(q.ticketId)) && typeof q.type==='string' && typeof q.resolution==='string','QA reference');
    for (const ref of [q.left,q.right].filter(Boolean)) requireValue(typeof ref.workbook==='string' && typeof ref.sheet==='string' && /^[A-Z]+\d+$/.test(ref.cell),'QA source cell');
    requireValue(q.left,'QA left evidence');
  }
  for (const t of tickets) {
    requireValue(typeof t.status==='string' && typeof t.summary==='string' && typeof t.workType==='string','ticket fields');
    requireValue(finiteOrNull(t.actualHours) && finiteOrNull(t.actualHoursSource),'ticket hours');
    for (const key of ['created','start','end']) requireValue(dateOrNull(t[key]),`ticket ${key}`);
    requireValue(new Set(array(t.familyIds,'ticket Family references')).size===t.familyIds.length,`ticket ${t.id} duplicate familyIds`);
    for (const id of t.familyIds) requireValue(fids.has(id) && familyById.get(id).ticketIds?.includes(t.id),`ticket ${t.id} reciprocal familyIds`);
  }
  for (const f of families) {
    requireValue(typeof f.key==='string' && typeof f.name==='string' && typeof f.ticketStatus==='string','Family fields');
    requireValue(new Set(array(f.ticketIds,'Family ticket references')).size===f.ticketIds.length,`Family ${f.id} duplicate ticketIds`);
    for (const id of f.ticketIds) requireValue(Number.isInteger(id) && tids.has(id) && ticketById.get(id).familyIds?.includes(f.id),`Family ${f.id} reciprocal ticketIds`);
    for (const key of ['start','end','actualCfm','actualTrm']) requireValue(dateOrNull(f[key]),`Family ${key}`);
    const e=f.milestoneEvidence?.actualCfm;
    requireValue(e && e.value===f.actualCfm && ['unknown','explicit','uploadCreatedProxy'].includes(e.kind) && typeof e.sourceCell==='string','CFM provenance'); array(f.reworkErrors,'rework errors');
  }
  for (const p of plan) {
    requireValue(typeof p.title==='string' && typeof p.system==='string' && typeof p.workType==='string','plan fields');
    requireValue(p.workType==='Revise the RFA library' ? typeof p.familyKey==='string' && p.familyKey.trim().length>0 : p.familyKey===null,`Plan ${p.id} familyKey`);
    requireValue(p.familyId===null || fids.has(p.familyId),'plan Family reference');
    for (const w of array(p.weeks,'plan weeks')) requireValue(w && Number.isInteger(w.week) && w.week>=1 && w.week<=53 && typeof w.activity==='string','plan week');
  }
  const roleRows=array(familyRoleHours.tickets,'role tickets'); unique(roleRows,'ticketId','role ticket');
  for (const t of roleRows) {
    requireValue(tids.has(t.ticketId) && typeof t.complete==='boolean','role ticket reference'); const users=new Set();
    for (const p of array(t.people,'role people')) { requireValue(p && typeof p.user==='string' && typeof p.role==='string' && Number.isFinite(p.hours) && !users.has(p.user),'person hours'); users.add(p.user); }
  }
  const seen=new Set();
  for (const e of array(timeHistory.entries,'weekly entries')) {
    requireValue(e && tids.has(e.ticketId) && /^2026-CW(0[1-9]|[1-3]\d|40)$/.test(e.week) && Number.isFinite(e.hours) && Number.isFinite(e.rawHours),'weekly entry');
    const key=`${e.ticketId}:${e.week}`; requireValue(!seen.has(key),'duplicate ticket-week'); seen.add(key);
  }
  requireValue(JSON.stringify(data.meta.sourceHashes)===JSON.stringify(manifest.sourceHashes),'main source hashes');
  requireValue(timeHistory.meta.matrixSha256===manifest.sourceHashes['Annotation_Ticket_User_Matrix_Checked.xlsx'],'weekly Matrix source');
  return bundle;
}
