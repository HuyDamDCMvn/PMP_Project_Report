# Project Rules

These are project-specific rules for the `PMP Dashboard` repository only.

- Apply these rules to all files, folders and work performed inside this repository.
- Do not treat these rules as global user preferences or reuse them in another repository, project or unrelated session.
- If work moves outside this repository, these rules no longer apply unless the user explicitly restates them.

## Session purpose

- Use this project session to maintain and apply the dashboard rules.
- For dashboard UI/UX design, implementation, audit, or refinement, use the project skill at `.agents/skills/pmp-dashboard-ui-ux/SKILL.md`.

## Approved decision register and agent workflow

- Before changing dashboard calculations, labels, filters, evidence, refresh or delivery behavior, read `docs/approved-rules-and-flow-20261006.md` and the current-contract section of `docs/kpi-definition.md`. They contain the user-approved project decisions and are required implementation references, not optional history.
- Explicit later user decisions supersede older presentation notes. Preserve the authoritative-source boundaries below. If current instructions conflict materially or a new rule would reinterpret source evidence, explain the conflict and ask for the missing decision before implementation.
- Keep all-project Uploaded Families separate from TIDP-linked coverage. Overview's approved arithmetic remainder is not the list/count of unmatched planned names; never invent a link to reconcile the two.
- Total issues means source error flags, not unique Families or tickets. Actual CFM, Actual_TRM and End Date are different milestones; do not substitute them for one another.
- For forecast experiments requested as calculation-only, report the training window, complete/partial-week treatment, regression versus averaging, anchor, cap and limitations without changing code/data/UI. Implement only when requested. The approved CFM projection uses a four-complete-week cumulative regression slope, anchored at current actual and capped at Plan; do not silently apply it to other forecasts.
- Simplifying labels or removing a review/banner does not approve unresolved proxy dates or remove source lineage/QA. Keep unresolved evidence explicit in metadata, details and documentation.
- Follow the scoped flow: calculate/inspect → clarify material choices when needed → implement approved change → verify calculations and relevant browser behavior → leave local preview running. Push/publish requires explicit authorization; if authorized, verify the deployed commit/workflow and report the actual result.
- Maintain new approved decisions in the project decision register/current KPI contract and route applicable skills to them. Do not store these project rules as global memory or modify unrelated skills.

## Authoritative data sources

- The only authoritative source files are these three files in `RawSource/`:
  - `RawSource/Annotation_Ticket_User_Matrix_Checked.xlsx`
  - `RawSource/DCMvn_TIDP_Combined_20260930.xlsx`
  - `RawSource/Family_Upload_vs_Annotation_Tickets_Checked.xlsx`
- Treat every other data file as derived data that inherits its results from the three authoritative files above.
- If any derived file conflicts with an authoritative file, use the authoritative file and regenerate or update the derived output accordingly.
- Do not use a derived file to overwrite or reinterpret conflicting values in an authoritative file.
- User-approved temporary exception (04/10/2026): use all mappings in `RawSource/Annotation_RFA_equivalence_Checked.xlsx`, sheet `Equivalence`, as supplied, including proposed/temporary rows. This is a supplemental TIDP-to-Family equivalence policy, not a replacement for the three authoritative sources. Preserve original names, dates, Ticket_IDs, outcomes and mapping decisions. Pin the approved workbook version; re-review changed mappings before renewing approval. Do not automatically apply suggested corrections from the audit.
- User-approved supplemental exception (04/10/2026): read ticket-system API time history to calculate the Weekly Annotation Project hours chart for Matrix Positive/Re-Assessment tickets, CW01–CW40. Net added/deleted time by the work date, floor ticket-week nets to 0.25 h, and disclose reconciliation gaps. This supplement must not overwrite Matrix total hours/classifications or other authoritative values. Keep credentials server-side and access read-only.
- For Family data, include only records belonging to the project `DCMvn_Annotation Project`.
- Exclude Family records from every other project from generated datasets, calculations, KPIs, filters, charts, tables and totals.
- Apply this project filter while processing the authoritative Family workbook, before producing any derived Family output.

## Weigh Score policy

- User decision (06/10/2026): Weigh Score is no longer a dashboard parameter.
- Ignore Weigh Score, Weigh Score Sum and Weigh Score Source in dashboard processing, calculations, validation and source-repair steps. Missing or inconsistent values must not block data refresh or deployment.
- Preserve these columns in source workbooks; do not correct their values for dashboard purposes.
- Continue validating project scope, Family identity, Ticket IDs, Ticket_Count, dates, classifications and recorded hours independently.
- This rule applies only to this repository and project.

## Dashboard completion and delivery

- After completing dashboard work, start the dashboard locally and leave it running so the user can inspect it.
- Report the local URL used for inspection.
- Do not push commits, publish, deploy, or otherwise update the remote repository unless the user explicitly instructs you to do so.
- Local builds, tests, generated artifacts, and local preview servers are allowed as part of implementation and verification.

## Dashboard sizing and component behavior

- Size the dashboard and its related components responsively so the complete interface fits the available web-browser viewport without unintended horizontal overflow or clipped content.
- Reflow, resize, or scroll component contents appropriately across different viewport sizes; do not rely on a single fixed screen resolution.
- Every dashboard component must support both expanded and collapsed states so users can open it for detail and collapse it to reduce visual clutter.
- Keep the expand/collapse control visible, understandable, and usable in both states, and preserve essential context such as the component title when collapsed.
- Dashboard components must use coordinated, bidirectional cross-filtering. Selecting a filterable value or data mark in any component must update every other applicable component from the same shared filter state.
- Cross-filtering applies to KPI cards, charts, heatmaps, matrices, tables, legends and other data-backed components whenever the selected dimension has a valid relationship to their data.
- Combine selections from different components as composable filters; do not silently replace unrelated active filters.
- Show the current selection on the component that initiated it and expose every active cross-filter as a visible, independently removable filter chip.
- Clicking the selected value again, removing its filter chip, or using `Reset Filters` must update all affected components consistently. `Reset Filters` must clear every cross-filter and hidden selection state.
- Preserve active cross-filters when components are expanded or collapsed and when navigating between dashboard views where the filter remains applicable.
- If an active selection produces no related records for a component, show an explicit filtered-empty state. Never ignore the selection or display unfiltered values without explanation.
- Non-filter controls such as expand/collapse, pagination, sorting, help, source trace and detail opening do not create cross-filters unless explicitly designed and labelled as filter actions.

## Abbreviations

- `DC` = Digital Coordinator
- `DL` = Digital Lead
- `DIG` = Digital Team
- `MM` = MEP Modeler
- `ML` = MEP Lead
- `MEP` = MEP Team
- `TRM` = Transmittal
- `AUD` = Audit
- `REV` = Revise
- `CFM` = Confirm
- Use these meanings consistently in dashboard labels, documentation, calculations, filters, legends and explanatory text.

## Project personnel

Use the following project-specific personnel mapping. Preserve the exact names, usernames and positions shown below when normalizing source data or displaying people in the dashboard.

```text
[Vi Trí] | Name | Username
Digital Lead | Huy Dam | hu.dam
Digital Coordinator | Long Dang | lk.dang
Digital Coordinator | Nhan Huynh | nd.huynh
Digital Coordinator | Khoa Doan | kd.doan
Digital Coordinator | Quy Ha | qn.ha
Digital Coordinator | Hung Nguyen | ht.nguyen
Digital Coordinator | Quan Nguyen | qd.nguyen
Digital Coordinator | Danh Nguyen | dahn.nguyen
COO | Frankie Imbrogno | f.imbrogno
MEP Lead | Lam Truong | l.truong
MEP Lead | Thuong Huynh | tv.huynh
MEP Lead | Nhut Le | n.le
MEP Lead | Sang Duong | s.duong
MEP Lead | Hanh Pham | h.pham
MEP Modeler | Binh Tran | b.tran
Other | Other | bn.hoai
Other | Other | bnh.ext
MEP Modeler | Cong Le | c.le
MEP Modeler | Duc Le | d.le
MEP Modeler | Dat Nguyen | d.nguyen
MEP Modeler | Danh Phan | d.phan
MEP Modeler | Dat Nguyen II | da.nguyen
MEP Modeler | Dang Nguyen | dhn.nguyen
Other | Other | dq.nong
MEP Modeler | Du Nguyen | dv.nguyen
MEP Modeler | Duong Quach | dx.quach
MEP Modeler | Huong Huynh | h.huynh
MEP Modeler | Huy Le | h.le
MEP Modeler | Ha Phan | ha.phan
MEP Modeler | Hoa Le | hoa.le
MEP Modeler | Ha Pham | ht.pham
MEP Modeler | Huy Tran | ht.tran
MEP Modeler | Khoa Mai | k.mai
MEP Modeler | Luc Nguyen | l.nguyen
MEP Modeler | Lam Pham | l.pham
MEP Modeler | Long Su | l.su
MEP Modeler | Nguyen Bui | n.bui
MEP Modeler | Nam Chau | n.chau
MEP Modeler | Nhat Dinh | n.dinh
MEP Modeler | Nhu Nguyen | n.nguyen
MEP Modeler | Ngoan Vo | n.vo
MEP Modeler | Phuc Tran | pv.tran
MEP Modeler | Thi Bui | t.bui
MEP Modeler | Toan Do | t.do
MEP Modeler | Thai Doan | t.doan
MEP Modeler | Truong Huynh | t.huynh
MEP Modeler | Trang Le | t.le
MEP Modeler | Trieu Luu | t.luu
MEP Modeler | Truong Tran | t.tran
MEP Modeler | Tam Trinh | t.trinh
MEP Modeler | Than Le | th.le
MEP Modeler | Tham Nguyen | th.nguyen
MEP Modeler | Thy Pham | tk.pham
MEP Modeler | Tan Doan | tm.doan
MEP Modeler | Thanh Nguyen | tn.nguyen
MEP Modeler | Trong Bui | tt.bui
MEP Modeler | Thoa Bui | ttc.bui
MEP Modeler | Tu Le | tu.le
MEP Modeler | Tuan Nguyen | tu.nguyen
MEP Modeler | Uyen Nguyen | u.nguyen
MEP Modeler | Yen Nguyen | y.nguyen
```

## System ownership

Use the following project-specific System-to-owner mapping:

```text
System | Person in charge
ELT/MSR | Hanh Pham
RLT | Lam Truong
SAN | Thuong Huynh
SPR MED | Sang Duong
HKG | Nhut Le
```

- Use the canonical personnel names and usernames defined in `Project personnel` when displaying or joining System ownership.
- Apply this mapping consistently to owner labels, filters, responsibility views, tables, charts and derived outputs.
