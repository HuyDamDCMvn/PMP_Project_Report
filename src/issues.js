import { agingBucket, isOpenTicket, ticketAge } from "./domain.js";

export const PERSON_NAMES = {
  "hu.dam": "Huy Dam", "lk.dang": "Long Dang", "nd.huynh": "Nhan Huynh",
  "kd.doan": "Khoa Doan", "qn.ha": "Quy Ha", "ht.nguyen": "Hung Nguyen",
  "qd.nguyen": "Quan Nguyen", "dahn.nguyen": "Danh Nguyen", "f.imbrogno": "Frankie Imbrogno",
  "l.truong": "Lam Truong", "tv.huynh": "Thuong Huynh", "n.le": "Nhut Le",
  "s.duong": "Sang Duong", "h.pham": "Hanh Pham",
};
export const personName = value => PERSON_NAMES[value] || value || "Unassigned";
export const samePerson = (a, b) => personName(a) === personName(b);

export function validSnapshotDate(value, asOf) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "") || value > asOf) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function isoWeekKey(value) {
  if (!validSnapshotDate(value, "9999-12-31")) return null;
  const day = new Date(`${value}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const year = day.getUTCFullYear();
  const week = Math.ceil(((day - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-CW${String(week).padStart(2, "0")}`;
}

export function matchesIssueFilters(ticket, filters, asOf) {
  if (filters.issueState && (isOpenTicket(ticket) ? "Open" : "Completed") !== filters.issueState) return false;
  if (filters.aging && (!isOpenTicket(ticket) || agingBucket(ticket, asOf) !== filters.aging)) return false;
  if (filters.activityWeek) {
    const created = validSnapshotDate(ticket.created, asOf) && isoWeekKey(ticket.created) === filters.activityWeek;
    const completed = !isOpenTicket(ticket) && validSnapshotDate(ticket.end, asOf) && isoWeekKey(ticket.end) === filters.activityWeek;
    if (!created && !completed) return false;
  }
  return true;
}

export function issueMetrics(tickets, asOf, weekCount = 8) {
  const open = tickets.filter(isOpenTicket);
  const completed = tickets.filter(ticket => !isOpenTicket(ticket) && validSnapshotDate(ticket.end, asOf));
  const hoursRows = tickets.filter(ticket => Number.isFinite(ticket.actualHours) && ticket.actualHours >= 0);
  const completedHours = completed.filter(ticket => Number.isFinite(ticket.actualHours) && ticket.actualHours >= 0);
  const sumHours = rows => rows.reduce((sum, row) => sum + row.actualHours, 0);
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const date = new Date(`${asOf}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 7 * (weekCount - 1 - i));
    const key = isoWeekKey(date.toISOString().slice(0, 10));
    return {
      key, label: key.split("-")[1],
      created: tickets.filter(ticket => validSnapshotDate(ticket.created, asOf) && isoWeekKey(ticket.created) === key),
      completed: completed.filter(ticket => isoWeekKey(ticket.end) === key),
    };
  });
  return {
    open, completed, weeks, hoursRows, completedHours,
    critical: open.filter(ticket => ticketAge(ticket, asOf) > 30),
    hours: sumHours(hoursRows),
    hoursPerCompleted: completedHours.length ? sumHours(completedHours) / completedHours.length : null,
    undatedCompletion: tickets.filter(ticket => !isOpenTicket(ticket) && !validSnapshotDate(ticket.end, asOf)),
  };
}
