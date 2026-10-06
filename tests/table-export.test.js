import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serializeCsv, selectTableRows, csvFilename, downloadCsv } from "../src/table-export.js";
import { aggregateMidp, midpTableExport } from "../src/midp.js";
import { tidpUploadDetails } from "../src/family-outcomes.js";

test("CSV preserves Unicode, commas, quotes, newlines, zero and negative numbers; neutralizes formulas", () => {
  const columns = [{ key: "value", label: "Value" }];
  const csv = serializeCsv(columns, [{ value: 'Thuọng, "A"\nB' }, { value: 0 }, { value: -1.5 }, { value: null }, { value: '=SUM(1,2)' }, { value: '  +cmd' }, { value: '\t@cmd' }]);
  assert.equal(csv, '\uFEFF"Value"\r\n"Thuọng, ""A""\nB"\r\n"0"\r\n"-1.5"\r\n""\r\n"\'=SUM(1,2)"\r\n"\'  +cmd"\r\n"\'\t@cmd"\r\n');
  assert.equal(serializeCsv(columns, []), '\uFEFF"Value"\r\n');
  assert.equal(csvFilename('TIDP / Uploaded: results', '2026-09-30'), 'TIDP-Uploaded-results-2026-09-30.csv');
});

test("render/export selection composes searches, sorts numerically, retains blanks last and never mutates source", () => {
  const rows = [{ id: 2, system: "SAN" }, { id: 10, system: "SAN" }, { id: 3, system: "RLT" }, { id: null, system: "SAN" }];
  const scope = { rows, columns: ["id", "system"], searches: { system: "san" }, sort: "id", descending: true };
  assert.deepEqual(selectTableRows(scope).map(r => r.id), [10, 2, null]);
  assert.deepEqual(selectTableRows({ ...scope, descending: false }).map(r => r.id), [2, 10, null]);
  assert.deepEqual(selectTableRows({ ...scope, searches: { system: "SAN", id: "10" } }).map(r => r.id), [10]);
  assert.deepEqual(rows.map(r => r.id), [2, 10, 3, null]);
});

test("Linked-coverage export includes all 2001 records and ticket-number column, not just the first 100", () => {
  const data = JSON.parse(readFileSync(new URL("../public/data/dashboard-data.json", import.meta.url)));
  const detail = tidpUploadDetails(data.deliverables, new Map(data.families.map(f => [f.id, f])), "Uploaded");
  const rows = selectTableRows({ ...detail, sort: "id", descending: true });
  assert.equal(rows.length, 2001);
  assert.ok(detail.columns.includes("ticketNumber"));
  const csv = serializeCsv(detail.columns.map(key => ({ key, label: key })), rows);
  assert.equal(csv.split("\r\n").length, 2003);
  assert.ok(csv.includes(rows.at(-1).id));
});

test("MIDP CSV repeats merged lot cells, keeps Actual above Plan and blank zero/future weeks", () => {
  const groups = aggregateMidp([{ id: "T1", workType: "RFA", system: "SAN", owner: "Thuong Huynh", weeks: [{ week: 41, activity: "REV" }] }]);
  const actual = new Map([[groups[0].key, [{ actualWeek: 40 }]]]);
  const model = midpTableExport(groups, [39, 40, 41], actual, 40);
  assert.deepEqual(model.rows.map(r => r.series), ["Actual", "Plan"]);
  assert.equal(model.rows[1].lot, model.rows[0].lot);
  assert.equal(model.rows[0].cw39, "");
  assert.equal(model.rows[0].cw40, 1);
  assert.equal(model.rows[0].cw41, "");
  assert.equal(model.rows[1].cw41, 1);
  assert.deepEqual(model.columns.map(c => c.label), ["Team / lot", "Owner", "Items", "Series", "CW39", "CW40", "CW41"]);
});

test("download creates a CSV Blob and named local download, then removes link and releases URL", async t => {
  const prior = globalThis.document;
  let blob, clicked = false, removed = false, revoked, cleanup;
  const link = { click() { clicked = true; }, remove() { removed = true; } };
  globalThis.document = { createElement: () => link, body: { append() {} } };
  t.after(() => { if (prior === undefined) delete globalThis.document; else globalThis.document = prior; });
  t.mock.method(URL, "createObjectURL", value => { blob = value; return "blob:test"; });
  t.mock.method(URL, "revokeObjectURL", value => { revoked = value; });
  t.mock.method(globalThis, "setTimeout", callback => { cleanup = callback; });
  downloadCsv({ title: "Uploaded", asOf: "2026-09-30", columns: [{ key: "id", label: "ID" }], rows: [{ id: 123 }] });
  assert.ok(clicked && removed);
  assert.equal(link.download, "Uploaded-2026-09-30.csv");
  assert.equal(link.href, "blob:test");
  assert.equal(await blob.text(), '"ID"\r\n"123"\r\n');
  assert.equal(new Uint8Array(await blob.arrayBuffer())[0], 239);
  cleanup();
  assert.equal(revoked, "blob:test");
});
