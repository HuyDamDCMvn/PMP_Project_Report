import test from 'node:test';
import assert from 'node:assert/strict';
import { returnedTicketErrors, familyTicketRows } from '../src/returned-tickets.js';
import { reworkHeatmap } from '../src/rework-heatmap.js';

test('Returned ticket distribution deduplicates tickets and error types across Families', () => {
  const families = [
    { id: 'a', reworkOutcome: 'Returned', ticketIds: [1, 1, 2], reworkErrors: ['A', 'B', 'A'] },
    { id: 'b', reworkOutcome: 'Returned', ticketIds: [1], reworkErrors: ['B', 'C'] },
    { id: 'c', reworkOutcome: 'One_pass', ticketIds: [1, 3], reworkErrors: ['D'] },
    { id: 'd', reworkOutcome: 'Returned', ticketIds: [4, 99], reworkErrors: [] },
  ];
  const rows = returnedTicketErrors(families, [1, 2, 3, 4].map(id => ({ id })));
  assert.deepEqual(rows.map(row => [row.ticketId, row.errorCount]), [[1, 3], [2, 2], [4, 0]]);
  assert.equal(rows[0].errorTypes, 'A, B, C');
  assert.equal(rows[2].returnedErrorCount, '0 error types');
  assert.equal(familyTicketRows(families)[0].ticketId, '1, 1, 2');
  assert.equal(familyTicketRows([{ id: 'empty' }])[0].ticketId, '—');
});

test('heatmap column totals reconcile all system buckets without duplicate allocation', () => {
  const families = [
    { id: 'a', reworkOutcome: 'Returned', reworkErrors: ['A', 'B'] },
    { id: 'b', reworkOutcome: 'Returned', reworkErrors: ['A'] },
    { id: 'c', reworkOutcome: 'Returned', reworkErrors: ['B'] },
  ];
  const model = reworkHeatmap(families, new Map([['a', 'HKG'], ['b', 'Multiple systems']]));
  assert.deepEqual(model.types.map((_, i) => model.rows.reduce((sum, row) => sum + row.cells[i].families.length, 0)), [2, 2]);
});
