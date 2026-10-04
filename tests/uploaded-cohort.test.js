import test from "node:test";
import assert from "node:assert/strict";
import { familyProductivity, uploadedFamilyCohort } from "../src/family-outcomes.js";
import { renderIssues, renderProductivity, renderFamilyAnalysis } from "../src/issues-view.js";

const families = [
  { id: "A", key: "a", end: "2026-09-29", ticketIds: [1, 2], reworkOutcome: "One_pass", uploader: "Hanh Pham" },
  { id: "B", key: "b", end: "2026-09-23", ticketIds: [1], reworkOutcome: "Returned", uploader: "Hanh Pham" },
  { id: "C", key: "c", end: null, ticketIds: [3] },
  { id: "D", key: "d", end: "2026-10-01", ticketIds: [4] },
];
const tickets = [
  { id: 1, status: "closed", actualHours: 10, end: "2026-09-29", workType: "Revise" },
  { id: 2, status: "assigned", actualHours: 0, created: "2026-08-01", workType: "Revise" },
  { id: 3, status: "closed", actualHours: 100 },
  { id: 4, status: "closed", actualHours: 200 },
  { id: 5, status: "closed", actualHours: 500 },
];

test("uploaded cohort excludes unuploaded and unlinked tickets and deduplicates shared evidence", () => {
  const m = familyProductivity([...families, families[0]], [...tickets, tickets[0]], "2026-09-30");
  assert.deepEqual(m.families.map(r => r.id), ["A", "B"]);
  assert.deepEqual(m.tickets.map(r => r.id), [1, 2]);
  assert.equal(m.issues.hours, 10);
  assert.equal(m.onePassRate, 0.5);
  assert.equal(m.weeks.at(-1).uploaded.length, 1);
  assert.equal(m.weeks.at(-2).uploaded.length, 1);
  assert.equal(m.weeks.reduce((n, w) => n + w.uploaded.length, 0), 2);
  assert.equal(familyProductivity([], tickets, "2026-09-30").onePassRate, null);
});

test("uploaded cohort preserves the supplied ticket and Family filter intersection", () => {
  const scope = uploadedFamilyCohort([families[1]], tickets.filter(r => r.id === 2), "2026-09-30");
  assert.equal(scope.families.length, 1);
  assert.equal(scope.tickets.length, 0);
});

test("two analysis renderers preserve issue and productivity evidence inside independent groups", () => {
  const evidence = new Map();
  const cohort = uploadedFamilyCohort(families, tickets, "2026-09-30");
  const props = { ...cohort, asOf: "2026-09-30", filters: {}, familyChart: "FAMILY_DONUT", panel: (title, subtitle, body) => title + subtitle + body,
    heading: () => "", escapeHtml: String, fmt: String, fmtDate: String, register: (id, meta) => evidence.set(id, meta) };
  const issues = renderIssues(props);
  assert.ok(issues.includes("FAMILY_DONUT"));
  assert.ok(issues.includes("Weekly linked issues"));
  assert.ok(!issues.includes("Open issues by handler"));
  assert.ok(!issues.includes("Issue pulse"));
  assert.ok(!issues.includes("Linked recorded effort"));
  const productivity = renderProductivity(props);
  assert.ok(productivity.includes("Weekly Family uploads"));
  assert.ok(!productivity.includes("Open issue aging"));
  assert.ok(evidence.get("productivity:families").columns.includes("name"));
  assert.deepEqual(evidence.get("productivity:hours").rows.map(r => r.id), [1, 2]);
  assert.ok(productivity.includes('data-set-filter="uploadWeek"'));
  const combined = renderFamilyAnalysis({ ...props, heading: () => "PAGE_HEADING", collapsed: { "group-issues": true } });
  assert.equal(combined.split("PAGE_HEADING").length - 1, 1);
  assert.ok(combined.includes(issues));
  assert.ok(combined.includes(productivity));
  assert.match(combined, /data-collapse="group-issues" data-layout-scope="team" >/);
  assert.match(combined, /data-collapse="group-productivity" data-layout-scope="productivity" open>/);
  assert.equal(combined.split('class="dashboard-group"').length - 1, 2);
});
