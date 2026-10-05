import { familyOutcome } from './family-outcomes.js';

export function familyTicketRows(families) {
  return families.map(family => ({ ...family, ticketId: (family.ticketIds || []).join(', ') || '—' }));
}

// Count each linked Matrix ticket once and union its distinct error types.
export function returnedTicketErrors(families, tickets) {
  const linked = new Map();
  for (const family of families) {
    if (familyOutcome(family) !== 'Returned') continue;
    for (const id of new Set(family.ticketIds || [])) {
      if (!linked.has(id)) linked.set(id, { errors: new Set(), families: new Set() });
      const record = linked.get(id);
      (family.reworkErrors || []).forEach(type => record.errors.add(type));
      record.families.add(family.id);
    }
  }
  return tickets.filter(ticket => linked.has(ticket.id)).map(ticket => {
    const record = linked.get(ticket.id);
    const errorCount = record.errors.size;
    return { ...ticket, ticketId: ticket.id, errorCount, errorTypes: [...record.errors].sort().join(', ') || 'No classified error', returnedErrorCount: `${errorCount} ${errorCount === 1 ? 'error type' : 'error types'}` };
  }).filter((ticket, index, rows) => rows.findIndex(row => row.id === ticket.id) === index);
}
