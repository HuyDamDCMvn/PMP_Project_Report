import test from "node:test";
import assert from "node:assert/strict";
import { isoWeekKey, issueMetrics, matchesIssueFilters, samePerson } from "../src/issues.js";

test("weekly issue throughput uses ISO year, snapshot and completion evidence", () => {
  assert.equal(isoWeekKey("2021-01-01"), "2020-CW53");
  assert.equal(isoWeekKey("2026-02-30"), null);
  const tickets = [
    { id: 1, status: "closed", created: "2026-09-22", end: "2026-09-29", actualHours: 0 },
    { id: 2, status: "resolved", created: "2026-09-29", end: "2026-09-30", actualHours: 10 },
    { id: 3, status: "assigned", created: "2026-08-01", end: "2026-09-29", actualHours: 5 },
    { id: 4, status: "closed", created: "2026-09-29", end: "2026-10-01", actualHours: 3 },
    { id: 5, status: "closed", created: null, end: null, actualHours: null },
  ];
  const m = issueMetrics(tickets, "2026-09-30");
  assert.deepEqual(m.weeks.at(-1).completed.map(x => x.id), [1, 2]);
  assert.equal(m.hoursPerCompleted, 5);
  assert.equal(m.hoursRows.length, 4);
  assert.equal(m.undatedCompletion.length, 2);
  assert.deepEqual(m.critical.map(x => x.id), [3]);
  assert.equal(matchesIssueFilters(tickets[2], { aging: ">30 days", activityWeek: "2026-CW40" }, "2026-09-30"), false);
  assert.equal(matchesIssueFilters(tickets[1], { issueState: "Completed", activityWeek: "2026-CW40" }, "2026-09-30"), true);
  assert.equal(matchesIssueFilters(tickets[0], { issueState: "Open" }, "2026-09-30"), false);
});

test("empty productivity retains unknown average and canonical owner links", () => {
  assert.equal(issueMetrics([], "2026-09-30").hoursPerCompleted, null);
  assert.equal(samePerson("tv.huynh", "Thuong Huynh"), true);
  assert.equal(samePerson("nd.huynh", "Thuong Huynh"), false);
});
