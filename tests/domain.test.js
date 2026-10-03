import test from "node:test";
import assert from "node:assert/strict";
import { agingBucket, deliverableState, dependencyState, forecastCatchUp, isOpenTicket, percentile, ticketAge } from "../src/domain.js";

test("forecast reaches planned scope without changing measured actuals", () => {
  const result = forecastCatchUp(1933, 2295, 140.25, 40);
  assert.equal(result.week, 43);
  assert.equal(result.points[0].value, 1933);
  assert.equal(result.points.at(-1).value, 2295);
  assert.equal(forecastCatchUp(1933, 2295, 0, 40).week, null);
  assert.deepEqual(forecastCatchUp(2295, 2295, 10, 40).points, []);
});

const context = { reportingWeek: 40, openTicketIdsByFamily: new Map([["FAM-1", [76286]], ["FAM-2", []]]) };

test("ticket status mapping separates open from resolved and closed", () => {
  assert.equal(isOpenTicket({ status: "new" }), true);
  assert.equal(isOpenTicket({ status: "assigned" }), true);
  assert.equal(isOpenTicket({ status: "resolved" }), false);
  assert.equal(isOpenTicket({ status: "closed" }), false);
});

test("ticket aging uses reporting snapshot and stable buckets", () => {
  const ticket = { created: "2026-08-20" };
  assert.equal(ticketAge(ticket, "2026-09-30"), 41);
  assert.equal(agingBucket(ticket, "2026-09-30"), ">30 days");
});

test("past TIDP work is not falsely marked complete", () => {
  const item = { plannedFinishWeek: 39, plannedStartWeek: 38, weeks: [], workType: "Framework deliverables" };
  assert.equal(deliverableState(item, context), "Past plan · unverified");
  assert.equal(dependencyState(item, context), "Confirm completion");
});

test("near-term unmatched RFA is at risk", () => {
  const item = { plannedFinishWeek: 41, plannedStartWeek: 40, weeks: [], workType: "Revise the RFA library", familyId: null };
  assert.equal(deliverableState(item, context), "At risk · no uploaded match");
});

test("near-term family with open ticket is at risk", () => {
  const item = { plannedFinishWeek: 41, plannedStartWeek: 40, weeks: [], workType: "Revise the RFA library", familyId: "FAM-1" };
  assert.equal(deliverableState(item, context), "At risk · open ticket");
});

test("percentile threshold is deterministic", () => {
  assert.equal(percentile([1, 2, 3, 4], 0.75), 3);
});
