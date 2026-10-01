# KPI dictionary

| KPI | Business meaning | Formula | Source | Filter behaviour | Interpretation |
| --- | --- | --- | --- | --- | --- |
| Total deliverables | TIDP work-item population | Count of TIDP rows | TIDP | All global filters | Planning scope, not completed output count |
| Current-week deliverables | Work planned in reporting week | Count with non-empty CW40/2026 | TIDP | System, owner, work type | Current delivery load |
| Future planned | Work with a planned marker after reporting week | Count where finish week > 40 | TIDP | Global | Remaining visible plan |
| Past plan, unverified | Final planned week has passed and completion evidence is unavailable | Finish week < 40 | TIDP | Global | Management must confirm completion; not labelled overdue |
| Open tickets | Active operational backlog | Status not in resolved/closed | Tickets | Department, handler, work type, status | Work still open |
| Aging-critical tickets | Old unresolved work | Open and age > 30 days | Tickets | Ticket filters | Escalation candidate; not contractual overdue |
| Average open age | Mean age of current backlog | Average(as-of − created) for open tickets | Tickets | Ticket filters | Backlog age profile |
| Average resolution time | Typical elapsed working time | Average supplied Duration for resolved/closed | Tickets | Ticket filters | Historical throughput |
| Uploaded families | Available content records | Count of main family rows | Family Upload | Category, uploader, ticket status | Uploaded population only |
| TIDP family coverage | Planned RFA work with uploaded exact match | Matched RFA work rows / all RFA work rows | TIDP + Family | System, owner | Derived content readiness coverage |
| No uploaded match | Planned RFA work without exact uploaded match | RFA work rows − matched rows | TIDP + Family | System, owner | Requires review; not proof of absolute absence |
| Data quality issues | Records/relationships requiring correction | Sum of visible rule counts | All | Dataset-aware | Source confidence and action queue |

`Completed Deliverables`, `On-time Delivery`, `Overdue Tickets`, `Ticket Due This Week`, `Family Approval` and previous-period variance are shown as unavailable when the required evidence is absent. They are never replaced with fabricated values.
