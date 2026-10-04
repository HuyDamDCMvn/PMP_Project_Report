import test from "node:test";
import assert from "node:assert/strict";
import { weeklyHours, renderWeeklySeries } from "../src/weekly-hours.js";

test("weekly spent hours preserve zero weeks and respect Positive ticket scope", () => {
  const dataset = { entries: [{ ticketId: "1", week: "2026-CW01", hours: 2.5 }, { ticketId: "2", week: "2026-CW01", hours: 9 }, { ticketId: "3", week: "2026-CW40", hours: 1.25 }] };
  const tickets = [{ id: "1", active: "Positive" }, { id: "2", active: "Negative" }, { id: "3", active: "Re-Assessment" }];
  const weeks = weeklyHours(dataset, tickets);
  assert.equal(weeks.length, 40);
  assert.equal(weeks[0].value, 2.5);
  assert.equal(weeks[1].value, 0);
  assert.equal(weeks[39].value, 1.25);
  assert.equal(weeklyHours(dataset, tickets, "2026-CW40")[0].value, 0);
});

test("line primitive labels units and has no filtering on nodes", () => {
  const html = renderWeeklySeries({ weeks: [{ key: "2026-CW01", value: 2.5 }], title: "Weekly hours", axisLabel: "Hours spent / week", fmt: String, label: w => String(w.value), weekLabel: w => w.key });
  assert.match(html, /Hours spent \/ week/);
  assert.match(html, /class="progress-actual"/);
  assert.doesNotMatch(html, /upload-line-point/);
});

test("overlay values use visible, collision-separated label rectangles", () => {
  const weeks = Array.from({ length: 24 }, (_, i) => ({ key: `2026-CW${20+i}`, value: i < 21 ? 8 + i % 3 : null }));
  const html = renderWeeklySeries({ weeks, title: 'Roles', axisLabel: 'Hours / Family', weekSpacing: 70, fmt: String,
    label: w => w.value === null ? '' : `<button>${w.value}</button>`, weekLabel: () => '',
    overlays: [7, 1].map(value => ({ className: 'test-role', weeks: weeks.map(w => ({ ...w, value: w.value === null ? null : value })), mark: w => `<button class="role-mark">${w.value}</button>` })) });
  assert.equal((html.match(/class="role-mark"/g) || []).length, 42);
  const boxes = [...html.matchAll(/<foreignObject x="([\d.]+)" y="([\d.]+)" width="70" height="44">/g)].map(m => ({ x: +m[1], y: +m[2] }));
  for (let i = 0; i < boxes.length; i++) for (const b of boxes.slice(i + 1)) {
    const a = boxes[i];
    assert.ok(!(a.x < b.x + 69.99 && a.x + 69.99 > b.x && a.y < b.y + 43.99 && a.y + 43.99 > b.y));
  }
});
