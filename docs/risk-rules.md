# Project-control risk rules

| Rule | Trigger | Severity | Evidence | Suggested action |
| --- | --- | --- | --- | --- |
| RISK-01 | TIDP final planned week is before reporting week and no completion field exists | Amber | TIDP weekly plan | Confirm actual completion and add actual-finish evidence |
| RISK-02 | RFA work is active in current/next week and has no exact match in uploaded-family source | Red | Derived TIDP-family comparison | Confirm naming, upload the family or document an approved exception |
| RISK-03 | Current/next-week TIDP RFA item maps to a family with an unresolved ticket | Red | Derived chain with direct family-ticket edge | Review the ticket owner and unblock the planned item |
| RISK-04 | Unresolved ticket age is greater than 30 days | Red | Ticket created date and status | Review scope, owner and next action |
| RISK-05 | Unresolved ticket age is 15–30 days | Amber | Ticket created date and status | Confirm progress before it enters the critical bucket |
| RISK-06 | User owns open tickets above the 75th percentile and at least one aging-critical ticket | Amber | Ticket handler and age | Rebalance work after checking complexity and availability |
| RISK-07 | TIDP row has no owner or no weekly marker | Grey | TIDP completeness | Complete planning metadata |
| RISK-08 | Family mapping references a ticket absent from the ticket snapshot | Grey | Family ticket ID comparison | Reconcile snapshots or source systems |

Rules are evaluated after filters. A user is never labelled a poor performer solely because of ticket count.

04/10/2026: RISK-02 and RISK-03 use the applied link policy (exact names plus user-approved temporary equivalence), not exact names alone. A temporary link does not prove model identity, approval or ticket completion. Source statuses remain unchanged and unresolved tickets remain unresolved.
