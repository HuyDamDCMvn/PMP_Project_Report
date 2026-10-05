import { samePerson, matchesIssueFilters, isoWeekKey } from './issues.js';
import { familyOutcome, uploadedFamilyRows } from './family-outcomes.js';
import { familyErrorSystems } from './rework-heatmap.js';
import { returnedTicketErrors } from './returned-tickets.js';
import { ticketSystem } from './midp.js';

// Planning baseline is native to TIDP. Evidence selections never inner-join it.
export function selectCohorts(data, f = {}, timeHistory) {
  const term = (f.search || '').toLowerCase().trim();
  const planOwner = f.planOwner || f.owner;
  const deliverables = data.deliverables.filter(r =>
    (!f.system || r.system === f.system) && (!planOwner || samePerson(r.owner, planOwner)) &&
    (!f.workType || r.workType === f.workType) &&
    (!term || `${r.id} ${r.title} ${r.system} ${r.owner}`.toLowerCase().includes(term)));
  const nativePlan = Boolean(f.system || planOwner || f.workType);
  const planIds = new Set(deliverables.map(r=>r.familyId).filter(Boolean));
  const systems = familyErrorSystems(data.deliverables);
  const errorIds = f.returnedErrorCount ? new Set(returnedTicketErrors(uploadedFamilyRows(data.families,data.meta.asOf),data.tickets).filter(t=>t.returnedErrorCount===f.returnedErrorCount).map(t=>t.id)) : null;
  let families = data.families.filter(r =>
    (!nativePlan || planIds.has(r.id)) && (!errorIds || r.ticketIds.some(id=>errorIds.has(id))) &&
    (!f.uploadWeek || isoWeekKey(r.end)===f.uploadWeek) && (!f.uploader || (r.uploader || 'Unassigned')===f.uploader) &&
    (!f.familyOutcome || familyOutcome(r)===f.familyOutcome) &&
    (!f.reworkError || (familyOutcome(r)==='Returned' && r.reworkErrors?.includes(f.reworkError))) &&
    (!f.errorSystem || (systems.get(r.id)||'Unknown system')===f.errorSystem) &&
    (!f.upload || f.upload==='Uploaded'));
  const familyIds = new Set(families.flatMap(r=>r.ticketIds));
  const familyFilter = Boolean(f.familyOutcome || f.uploadWeek || f.uploader || f.reworkError || f.errorSystem || f.returnedErrorCount || f.upload);
  const ticketFilter = Boolean(f.handler || f.reporter || f.active || f.status || f.issueState || f.aging || f.activityWeek || f.spentWeek);
  const tickets = data.tickets.filter(r =>
    (!errorIds || errorIds.has(r.id)) && matchesIssueFilters(r,f,data.meta.asOf) &&
    (!f.handler || samePerson(r.handler,f.handler)) && (!f.reporter || (r.reporter||'Unknown reporter')===f.reporter) &&
    (!f.active || (['Positive','Re-Assessment'].includes(r.active)?'Positive':r.active)===f.active) &&
    (!f.status || r.status===f.status) && (!f.workType || r.workType===f.workType) &&
    (!nativePlan || familyIds.has(r.id) || (r.workType!=='Revise the RFA library' && deliverables.some(p=>p.workType===r.workType && p.system===ticketSystem(r.summary)))) &&
    (!familyFilter || familyIds.has(r.id)) &&
    (!f.spentWeek || (timeHistory?.entries||[]).some(e=>e.ticketId===r.id && e.week===f.spentWeek && e.hours!==0)) &&
    (!term || `${r.id} ${r.summary} ${r.handler} ${r.reporter}`.toLowerCase().includes(term)));
  if (ticketFilter) {
    const ids=new Set(tickets.map(r=>r.id));
    families=families.filter(r=>r.ticketIds.some(id=>ids.has(id)));
  }
  const selectedIds=new Set(families.map(r=>r.id));
  const evidenceSelected=familyFilter || ticketFilter;
  const evidenceDeliverables=deliverables.filter(r=>selectedIds.has(r.familyId) || (!r.familyKey && tickets.some(t=>t.workType===r.workType && ticketSystem(t.summary)===r.system)));
  return { deliverables, families, tickets, evidenceDeliverables, evidenceSelected,
    scopeNote: evidenceSelected ? 'Planning baseline retained. Actuals and ticket metrics reflect the selected evidence scope; coverage is not full-plan completion.' : '' };
}
