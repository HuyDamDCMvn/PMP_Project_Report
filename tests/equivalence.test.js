import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { linkedUploadDates } from "../src/family-links.js";
import { aggregateMidp, midpWeeklyActual } from "../src/midp.js";
import { familyProductivity, tidpUploadDetails } from "../src/family-outcomes.js";

test("all upload timelines follow familyId aliases, preserve identity, filters and date boundaries", () => {
  const records = [{ familyKey: "plan", familyId: "a" }, { familyKey: "plan", familyId: "a" }, { familyKey: "invalid", familyId: "b" }, { familyKey: "future", familyId: "c" }, { familyKey: "unlinked", familyId: null }];
  const families = [{ id: "a", key: "upload", end: "2026-09-29" }, { id: "a", key: "upload", end: "2026-09-28" }, { id: "b", end: "2026-02-30" }, { id: "c", end: "2026-10-01" }, { id: "d", key: "unlinked", end: "2026-09-28" }];
  assert.deepEqual([...linkedUploadDates(records, families, "2026-09-30")], [["plan", "2026-09-28"]]);
  assert.equal(linkedUploadDates(records, [], "2026-09-30").size, 0);
  assert.equal(families[0].key, "upload");
});

test("snapshot reconciles donut, detail, weekly MIDP, cumulative uploads and cohort after temporary mapping", () => {
  const data = JSON.parse(readFileSync(new URL("../public/data/dashboard-data.json", import.meta.url)));
  const rfa = data.deliverables.filter(r => r.workType === "Revise the RFA library");
  const unique = new Map(rfa.map(r => [r.familyKey, r]));
  assert.equal(unique.size, 2295);
  assert.equal([...unique.values()].filter(r => r.familyId).length, 2001);
  assert.equal([...unique.values()].filter(r => !r.familyId).length, 294);
  assert.equal([...unique.values()].filter(r => r.familyMatchMethod === "Temporary equivalence").length, 68);
  const dates = linkedUploadDates(rfa, data.families, data.meta.asOf);
  assert.equal(dates.size, 2001);
  const familyById = new Map(data.families.map(f => [f.id, f]));
  assert.equal(tidpUploadDetails(rfa, familyById, "Uploaded").rows.length, 2001);
  assert.equal(tidpUploadDetails(rfa, familyById, "No upload match").rows.length, 294);
  const allWeeks = aggregateMidp(rfa).flatMap(g => midpWeeklyActual(g, data.families, data.meta.asOf));
  assert.equal(allWeeks.length, 2001);
  const byWeek = new Map();
  for (const r of allWeeks) byWeek.set(r.actualWeek, (byWeek.get(r.actualWeek) || 0) + 1);
  let cumulative = 0;
  for (let week = 1; week <= 40; week++) {
    cumulative += byWeek.get(week) || 0;
    const sunday = new Date(Date.UTC(2025, 11, 29 + week * 7 - 1)).toISOString().slice(0, 10);
    assert.equal(cumulative, [...dates.values()].filter(d => d <= (sunday < data.meta.asOf ? sunday : data.meta.asOf)).length);
  }
  for (const group of aggregateMidp(rfa)) {
    const ids = new Set(group.records.map(r => r.familyId).filter(Boolean));
    const scoped = data.families.filter(f => ids.has(f.id));
    assert.equal(midpWeeklyActual(group, scoped, data.meta.asOf).length, ids.size);
    assert.equal(linkedUploadDates(group.records, scoped, data.meta.asOf).size, ids.size);
  }
  const cohort = familyProductivity(data.families, data.tickets, data.meta.asOf, { startWeek: 20, target: 2295 });
  assert.equal(cohort.weeklyRate, 143.25);
  assert.deepEqual(cohort.forecastWeeks, [{ week: 41, value: 143.25 }, { week: 42, value: 143.25 }, { week: 43, value: 7.5 }]);
  assert.equal(cohort.weeks[0].key, "2026-CW20");
  assert.equal(cohort.weeks.length, 21);
  assert.equal(cohort.weeks[0].uploaded.length, 0);
  assert.equal(cohort.families.length, 2001);
  assert.equal(cohort.onePass.length, 1500);
  assert.equal(cohort.issues.hours, 15953.25);
  for (const week of cohort.weeks) {
    const n = Number(week.key.slice(-2));
    const cutoff = w => {
      const end = new Date(Date.UTC(2025, 11, 29 + w * 7 - 1)).toISOString().slice(0, 10);
      return end < data.meta.asOf ? end : data.meta.asOf;
    };
    const cumulative = w => [...dates.values()].filter(date => date <= cutoff(w)).length;
    assert.equal(week.uploaded.length, cumulative(n) - cumulative(n - 1), `${week.key}: Productivity equals change in Overview Actual`);
  }
  // Explicit approval is for the workbook as supplied, not our suggested correction.
  const cap = data.families.find(f => f.name === "420_PF_CS_cCap_Mapress");
  assert.equal(cap.tidpEquivalence.tidpName, "434_PF_CO_Cap_MapressFKMBlue");
  assert.deepEqual(cap.ticketIds, [72176]);
  assert.equal(cap.tidpEquivalence.sourceDecision, "proposed");
  assert.equal(data.meta.equivalence.gitBlob, "8c9bc55511f3f5f107a5923739d65361aec7fa15");
});
