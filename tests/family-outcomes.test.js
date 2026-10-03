import test from "node:test";
import assert from "node:assert/strict";
import { familyOutcome, uploadedFamilyRows } from "../src/family-outcomes.js";

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
