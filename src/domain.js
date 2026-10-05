export const CLOSED_TICKET_STATUSES = new Set(["resolved", "closed"]);

export function isOpenTicket(ticket) {
  return !CLOSED_TICKET_STATUSES.has(ticket.status);
}

export function daysBetween(laterIso, earlierIso) {
  if (!laterIso || !earlierIso) return null;
  const later = new Date(`${laterIso}T12:00:00Z`);
  const earlier = new Date(`${earlierIso}T12:00:00Z`);
  return Math.max(0, Math.floor((later - earlier) / 86400000));
}

export function ticketAge(ticket, asOf) {
  return daysBetween(asOf, ticket.created);
}

export function agingBucket(ticket, asOf) {
  const age = ticketAge(ticket, asOf);
  if (age === null) return "Unknown";
  if (age <= 3) return "0–3 days";
  if (age <= 7) return "4–7 days";
  if (age <= 14) return "8–14 days";
  if (age <= 30) return "15–30 days";
  return ">30 days";
}

export function deliverableState(deliverable, context) {
  const { reportingWeek, openTicketIdsByFamily = new Map() } = context;
  if (!deliverable.plannedFinishWeek) return "Unscheduled";
  if (deliverable.plannedFinishWeek < reportingWeek) return "Past plan · unverified";
  const nearTerm = deliverable.plannedStartWeek <= reportingWeek + 1;
  if (nearTerm && deliverable.workType === "Revise the RFA library" && !deliverable.familyId) {
    return "At risk · no uploaded match";
  }
  if (nearTerm && deliverable.familyId && (openTicketIdsByFamily.get(deliverable.familyId)?.length || 0) > 0) {
    return "At risk · open ticket";
  }
  if (deliverable.weeks.some((item) => item.week === reportingWeek)) return "Current week";
  if (deliverable.plannedStartWeek === reportingWeek + 1) return "Due soon";
  return "On track";
}

export function dependencyState(deliverable, context) {
  const state = deliverableState(deliverable, context);
  if (state.startsWith("At risk")) return "Intervention";
  if (state.startsWith("Past plan")) return "Confirm completion";
  if (state === "Unscheduled") return "Incomplete data";
  if (deliverable.relationship === "Unlinked") return "Unlinked";
  return "No evidenced blocker";
}

export function percentile(values, fraction) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const index = Math.ceil(fraction * ordered.length) - 1;
  return ordered[Math.max(0, index)];
}

export function groupCount(items, accessor) {
  const output = new Map();
  items.forEach((item) => {
    const key = accessor(item) || "Unknown";
    output.set(key, (output.get(key) || 0) + 1);
  });
  return output;
}

export function buildContext(data) {
  const openTicketIdsByFamily = new Map();
  data.families.forEach((family) => {
    const open = family.ticketIds.filter((ticketId) => {
      const ticket = data.tickets.find((candidate) => candidate.id === ticketId);
      return ticket && isOpenTicket(ticket);
    });
    openTicketIdsByFamily.set(family.id, open);
  });
  return { reportingWeek: data.meta.reportingWeek, openTicketIdsByFamily };
}

export function linearRegressionSlope(points) {
  if (points.length < 2 || points.some(p => !Number.isFinite(p.week) || !Number.isFinite(p.value))) return null;
  const x = points.reduce((s,p) => s + p.week, 0) / points.length;
  const y = points.reduce((s,p) => s + p.value, 0) / points.length;
  const variance = points.reduce((s,p) => s + (p.week - x) ** 2, 0);
  return variance ? points.reduce((s,p) => s + (p.week - x) * (p.value - y), 0) / variance : null;
}

export function forecastCatchUp(actual, target, weeklyRate, reportingWeek) {
  if (!Number.isFinite(target) || target <= 0) return { state: 'no_applicable_plan', week: null, points: [] };
  if (!Number.isFinite(actual)) return { state: 'actual_unavailable', week: null, points: [] };
  if (actual >= target) return { state: 'reached', week: reportingWeek, points: [] };
  if (!Number.isFinite(weeklyRate) || !(weeklyRate > 0)) return { state: 'rate_unavailable', week: null, points: [] };
  const week = reportingWeek + Math.ceil((target - actual) / weeklyRate);
  const end = Math.min(week, reportingWeek + 52);
  return { state: 'forecast', week, points: Array.from({ length: end - reportingWeek + 1 }, (_, i) => ({
    week: reportingWeek + i, value: Math.min(target, actual + i * weeklyRate),
  })) };
}

export function managementAttention(data, deliverables, tickets, families, context) {
  const items = [];
  const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const familyById = new Map(families.map((family) => [family.id, family]));

  deliverables.forEach((deliverable) => {
    const nearTerm = deliverable.plannedFinishWeek >= context.reportingWeek && deliverable.plannedStartWeek <= context.reportingWeek + 1;
    if (!nearTerm || deliverable.workType !== "Revise the RFA library") return;
    if (!deliverable.familyId) {
      items.push({
        severity: "critical",
        rule: "RISK-02",
        issue: "Near-term RFA work has no uploaded-family match under the applied mapping policy",
        impact: `${deliverable.title} is planned through CW${deliverable.plannedFinishWeek}.`,
        owner: deliverable.owner || "Unassigned",
        due: `CW${deliverable.plannedFinishWeek}`,
        related: deliverable.id,
        action: "Confirm the family name, upload status or approved exception.",
        kind: "deliverable",
        id: deliverable.id,
      });
      return;
    }
    const family = familyById.get(deliverable.familyId);
    const openTicketIds = context.openTicketIdsByFamily.get(deliverable.familyId) || [];
    if (openTicketIds.length) {
      const firstTicket = ticketById.get(openTicketIds[0]);
      items.push({
        severity: "critical",
        rule: "RISK-03",
        issue: "Near-term deliverable is linked to an unresolved ticket",
        impact: `${deliverable.title} → ${family?.name || deliverable.familyId} → #${openTicketIds[0]}.`,
        owner: firstTicket?.handler || deliverable.owner || "Unassigned",
        due: `CW${deliverable.plannedFinishWeek}`,
        related: deliverable.id,
        action: "Review the ticket next action and protect the planned delivery.",
        kind: "deliverable",
        id: deliverable.id,
      });
    }
  });

  tickets.filter(isOpenTicket).forEach((ticket) => {
    const age = ticketAge(ticket, data.meta.asOf);
    if (age > data.config.ticketAgingCriticalDays) {
      items.push({
        severity: "critical",
        rule: "RISK-04",
        issue: `Open ticket has aged ${age} days`,
        impact: `#${ticket.id} · ${ticket.summary}`,
        owner: ticket.handler || "Unassigned",
        due: "No due date in source",
        related: `Ticket #${ticket.id}`,
        action: "Confirm scope, ownership and a dated next action.",
        kind: "ticket",
        id: ticket.id,
      });
    }
  });

  return items
    .sort((a, b) => (a.rule === "RISK-03" ? -1 : 0) - (b.rule === "RISK-03" ? -1 : 0))
    .slice(0, 10);
}
