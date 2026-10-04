import test from "node:test";
import assert from "node:assert/strict";
import { weeklyFamilyEffort, weeklyRoleEffort, renderWeeklyFamilyEffort } from "../src/weekly-family-effort.js";
import { renderWeeklySeries, placeWeeklyLabels, weeklyMonthBands } from "../src/weekly-hours.js";

test("weekly Family effort deduplicates shared tickets and preserves missing-hour denominator", () => {
  const families = [
    { id: "a", key: "a", end: "2026-05-18", ticketIds: [1, 2] },
    { id: "b", key: "b", end: "2026-05-19", ticketIds: [1] },
    { id: "c", key: "c", end: "2026-05-25", ticketIds: [3] },
    { id: "future", key: "future", end: "2026-10-01", ticketIds: [1] },
  ];
  const tickets = [{ id: 1, actualHours: 5.25 }, { id: 2, actualHours: null }, { id: 3, actualHours: 0 }];
  const weeks = weeklyFamilyEffort(families, tickets, "2026-09-30");
  assert.equal(weeks.length, 21);
  assert.equal(weeks[0].value, null);
  assert.equal(weeks[1].hours, 5.25);
  assert.equal(weeks[1].value, 2.625);
  assert.equal(weeks[1].families.length, 2);
  assert.equal(weeks[1].missing, 1);
  assert.equal(weeks[2].value, 0);
  assert.equal(weeks.at(-1).value, null);
});

test("shared line breaks across unavailable weeks instead of drawing zero or bridging gaps", () => {
  const weeks = [{ value: 5 }, { value: null }, { value: 0 }];
  const html = renderWeeklySeries({ weeks, title: "Average", axisLabel: "h / Family", legend: "Average", fmt: String, label: () => "label", weekLabel: () => "week" });
  assert.equal((html.match(/<polyline /g) || []).length, 2);
  assert.equal((html.match(/class="progress-actual"/g) || []).length, 2);
  assert.doesNotMatch(html, /NaN/);
});

test("average chart aligns CW20–CW43 without future data or redundant captions", () => {
  const html = renderWeeklyFamilyEffort({ families: [], tickets: [], asOf: "2026-09-30",
    filters: {}, fmt: String, register: () => {}, panel: (title, subtitle, body) => {
      assert.equal(subtitle, "");
      return body;
    } });
  assert.doesNotMatch(html, /progress-legend|Known recorded hours only/);
  const weeks = Array.from({ length: 24 }, (_, i) => ({ key: `2026-CW${20 + i}`, value: i === 20 ? 7.78 : null }));
  const series = renderWeeklySeries({ weeks, currentWeek: "2026-CW40", title: "Average",
    axisLabel: "h / Family", legend: "", fmt: String, label: () => "", weekLabel: w => w.key });
  assert.match(series, /2026-CW43/);
  assert.equal((series.match(/class="progress-current"/g) || []).length, 1);
  assert.equal((series.match(/class="progress-actual"/g) || []).length, 1);
  assert.doesNotMatch(series, /progress-legend/);
});

test("weekly axis control changes grid spacing only and omits standalone footnote", () => {
  const render = value => renderWeeklySeries({ weeks: [{key: "2026-CW40", value: 7.78}], title: "Average", axisLabel: "h / Family",
    fmt: String, label: w => String(w.value), weekLabel: w => w.key,
    axis: { id: "effort-axis-step", key: "effortAxisStep", label: "Y-axis step", min: 0.25, max: 100, increment: 0.25, value } });
  const first = render(5), second = render(2);
  assert.match(second, /data-weekly-axis="effortAxisStep"/);
  assert.match(second, /value="2"/);
  assert.match(second, /7.78/);
  assert.notEqual((first.match(/class="progress-grid"/g) || []).length, (second.match(/class="progress-grid"/g) || []).length);
  assert.doesNotMatch(second, /upload-line-footnote/);
});

test("weekly labels avoid Y ticks and each other when the scale changes", () => {
  for (const bottom of [330, 400, 800]) {
    const boxes = placeWeeklyLabels(Array.from({length: 40}, (_, i) => ({x: 90 + i * 50, y: bottom - 30 - (i % 3) * 6})), 2100, bottom);
    boxes.forEach((box, i) => {
      assert.ok(box.x >= 96 && box.y >= 8 && box.y + 44 <= bottom);
      boxes.slice(0, i).forEach(other => assert.ok(box.x >= other.x + 76 || other.x >= box.x + 76 || box.y >= other.y + 48 || other.y >= box.y + 48));
    });
  }
});

test("month row groups ISO weeks by Thursday across month and year boundaries", () => {
  const bands = weeklyMonthBands([{key: "2026-CW01"}, {key: "2026-CW05"}, {key: "2026-CW06"}, {key: "2026-CW40"}]);
  assert.deepEqual(bands.map(b => [b.label, b.start, b.end]), [["Jan", 0, 1], ["Feb", 2, 2], ["Oct", 3, 3]]);
});

test('role averages use recorder hours, deduplicate tickets and respect scoped tickets', () => {
  const weeks = [{key:'2026-CW21', families:[{ticketIds:[1,2]},{ticketIds:[1]}], linkedTickets:[{id:1}]}];
  const data = {tickets:[{ticketId:1,complete:true,people:[{user:'mm',role:'MEP Modeler',hours:6},{user:'dc',role:'Digital Coordinator',hours:1}]}]};
  assert.equal(weeklyRoleEffort(weeks,data,'MEP Modeler')[0].value,3);
  assert.equal(weeklyRoleEffort(weeks,data,'Digital Coordinator')[0].value,0.5);
  weeks[0].families.push({ticketIds:[]});
  assert.equal(weeklyRoleEffort(weeks,data,'MEP Modeler')[0].value,2);
  assert.equal(weeklyRoleEffort(weeks,data,'Digital Coordinator')[0].value,1/3);
  assert.equal(weeklyRoleEffort(weeks,data,'Other')[0].value,0);
  data.tickets[0].complete=false;
  assert.equal(weeklyRoleEffort(weeks,data,'MEP Modeler')[0].value,null);
});
