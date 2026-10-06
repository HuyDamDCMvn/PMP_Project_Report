import test from "node:test";
import assert from "node:assert/strict";
import { familyOutcome, uploadedFamilyRows, tidpUploadDetails, familyProductivity } from "../src/family-outcomes.js";

test("productivity averages include idle calendar days and never multiply shared ticket hours", () => {
  const families = [{ id: "a", end: "2026-09-28", ticketIds: [1, 2] }, { id: "b", end: "2026-09-30", ticketIds: [1] }];
  const m = familyProductivity(families, [{ id: 1, actualHours: 12 }, { id: 2, actualHours: null }], "2026-09-30");
  assert.equal(m.calendarDays, 3);
  assert.equal(m.uploadsPerDay, 2 / 3);
  assert.equal(m.hoursPerFamily, 6);
  assert.equal(familyProductivity([], [], "2026-09-30").uploadsPerDay, null);
  assert.equal(familyProductivity(families, [], "2026-09-30").hoursPerFamily, null);
});

test("only Uploaded TIDP detail adds source ticket numbers without changing its population", () => {
  const deliverables = [
    { id: "a", familyKey: "a", familyId: "f1", workType: "Revise the RFA library" },
    { id: "b", familyKey: "b", familyId: "f2", workType: "Revise the RFA library" },
    { id: "c", familyKey: "c", familyId: null, workType: "Revise the RFA library" },
  ];
  const families = new Map([["f1", { ticketIds: [100, 20, 100] }], ["f2", { ticketIds: [] }]]);
  const uploaded = tidpUploadDetails(deliverables, families, "Uploaded");
  assert.deepEqual(uploaded.columns, ["id", "title", "system", "owner", "ticketNumber", "workType"]);
  assert.deepEqual(uploaded.rows.map(r => [r.id, r.ticketNumber]), [["a", "20, 100"], ["b", null]]);
  assert.equal(deliverables[0].ticketNumber, undefined);
  const missing = tidpUploadDetails(deliverables, families, "Not uploaded");
  assert.deepEqual(missing.columns, ["id", "title", "system", "owner", "workType"]);
  assert.deepEqual(missing.rows, [deliverables[2]]);
});

test("uploaded outcomes use the source field, unique families and snapshot cutoff", () => {
  const families = [
    { id: "1", key: "a", end: "2026-09-30", reworkOutcome: "One_pass", ticketIds: [1, 2] },
    { id: "2", key: "b", end: "2026-09-29", reworkOutcome: "Returned", ticketIds: [3] },
    { id: "3", key: "c", end: "2026-09-28", reworkOutcome: null, active: "Positive" },
    { id: "4", key: "a", end: "2026-09-29", reworkOutcome: "One_pass" },
    { id: "5", key: "d", end: "2026-10-01", reworkOutcome: "Returned" },
    { id: "6", key: "e", end: null, reworkOutcome: "One_pass" },
  ];
  const rows = uploadedFamilyRows(families, "2026-09-30");
  assert.deepEqual(rows.map(familyOutcome), ["One pass", "Returned", "Unclassified"]);
  assert.deepEqual(rows.filter(row => familyOutcome(row) === "Returned").map(row => row.id), ["2"]);
  assert.equal(familyOutcome({ reworkOutcome: "New outcome" }), "Unclassified");
});

test('approved Ticket 72578 outcome is Returned without inventing error flags or mutating the original',()=>{
  const family={id:'stable-test',key:'434pfcoccapmapressfkmblue',ticketIds:[72578],reworkOutcome:null,reworkErrors:[],end:'2026-09-30'};
  assert.equal(familyOutcome(family),'Returned');const rows=uploadedFamilyRows([family],'2026-09-30');assert.equal(rows[0].reworkOutcome,'Returned');assert.equal(rows[0].sourceReworkOutcome,null);assert.equal(family.reworkOutcome,null);assert.deepEqual(rows[0].reworkErrors,[]);
});
