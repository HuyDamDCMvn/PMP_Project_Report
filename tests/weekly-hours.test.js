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

test('hours forecast excludes partial week, preserves zero and respects selected-week availability',async()=>{
  const {forecastWeeklyHours}=await import('../src/weekly-hours.js');
  const weeks=Array.from({length:40},(_,i)=>({key:`2026-CW${String(i+1).padStart(2,'0')}`,value:i===39?9999:100}));
  const forecast=forecastWeeklyHours(weeks,'2026-09-30');assert.equal(forecast.rate,0);assert.equal(forecast.points[0].value,100);assert.equal(forecast.points[0].key,'2026-CW41');assert.equal(forecast.points.length,3);
  assert.equal(forecastWeeklyHours(weeks,'2026-09-30','2026-CW39').points.length,0);
  assert.equal(forecastWeeklyHours(weeks.map(w=>({...w,value:0})),'2026-09-30').rate,0);
  assert.equal(forecastWeeklyHours(weeks.slice(0,2),'2026-09-30').points.length,0);
});

test('weekly hours OLS extrapolates fitted intercept and slope and floors negative estimates',async()=>{
  const {forecastWeeklyHours}=await import('../src/weekly-hours.js');
  const weeks=Array.from({length:40},(_,i)=>({key:`2026-CW${String(i+1).padStart(2,'0')}`,value:10*(i+1)+5}));
  const result=forecastWeeklyHours(weeks,'2026-09-30');assert.ok(Math.abs(result.rate-10)<1e-10);assert.ok(Math.abs(result.intercept-5)<1e-10);result.points.forEach((p,i)=>assert.ok(Math.abs(p.value-[415,425,435][i])<1e-10));
  const falling=weeks.map((w,i)=>({...w,value:400-10*(i+1)}));assert.deepEqual(forecastWeeklyHours(falling,'2026-09-30').points.map(p=>p.value),[0,0,0]);
});

test('hours regression uses CW22–39 except CW36 without removing actual evidence',async()=>{
  const {forecastWeeklyHours}=await import('../src/weekly-hours.js');
  const weeks=Array.from({length:40},(_,i)=>({key:`2026-CW${String(i+1).padStart(2,'0')}`,value:i===35||i<21||i===39?99999:10*(i+1)+5}));
  const result=forecastWeeklyHours(weeks,'2026-09-30');assert.ok(Math.abs(result.rate-10)<1e-10);assert.ok(Math.abs(result.intercept-5)<1e-10);result.points.forEach((p,i)=>assert.ok(Math.abs(p.value-[415,425,435][i])<1e-10));assert.equal(weeks[35].value,99999);
  assert.equal(forecastWeeklyHours(weeks.filter(w=>w.key!=='2026-CW28'),'2026-09-30').points.length,0);
});
