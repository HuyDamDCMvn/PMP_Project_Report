# PMP Project Report Dashboard

An integrated BIM / Digital Delivery project-control dashboard combining MIDP/TIDP planning, Annotation Ticket operations and Revit Family Upload readiness.

The data-governance, terminology and delivery rules documented in this repository are specific to this PMP Dashboard project. They must not be assumed to apply to other repositories or projects.

## Purpose

The application helps Directors, Project Managers, Digital Leads and BIM Coordinators move from project health to evidence and action. It is not a generic BI gallery: every risk rule is explicit, every relationship is labelled and every high-level record can be traced to its source chain.

## Dashboard pages

- Executive Overview
- MIDP / TIDP Delivery Control
- Annotation Ticket Control
- Family Readiness
- Cross-data Dependencies
- Team & Resource
- Data Quality

## Current source snapshots

Place controlled source files in `RawSource/`:

- `DCMvn_TIDP_Combined_20260930.xlsx`
- `Annotation_Ticket_User_Matrix_Checked.xlsx`
- `Family_Upload_vs_Annotation_Tickets_Checked.xlsx`

The committed `public/data/dashboard-data.json` is generated from these snapshots. Rebuild it whenever the source files change.

These three workbooks are the authoritative sources for the dashboard. Every other data file in the repository is derived from them. If a derived file conflicts with one of these workbooks, resolve the conflict in favor of the authoritative workbook and regenerate the derived output.

For Family data, include only records belonging to `DCMvn_Annotation Project`. Family records associated with any other project must be excluded before generating derived data, KPI totals or dashboard views.

## Architecture

```text
Excel snapshots
  ↓
Python validation and normalization
  ↓
JSON data contract
  ↓
Central project-control rules
  ↓
Filter state and traceable dashboard views
  ↓
Vite static production build
```

Important evidence limitations are deliberate. The supplied TIDP has weekly plan markers but no actual-finish field; tickets have actual work dates but no contractual due date; the Family source has uploaded records but no approval state. The UI shows these as unavailable or unverified instead of inventing green status.

## Local setup

Requirements: Node.js 22+; Python 3 with `pandas` and `openpyxl` only when rebuilding source data.

```bash
git clone https://github.com/HuyDamDCMvn/PMP_Project_Report.git
cd PMP_Project_Report
npm install
npm run data:build
npm run dev
```

Open the local URL printed by Vite. The raw `index.html` file should not be opened directly because the application loads modules and data through HTTP.

After dashboard changes are complete, leave the local dashboard server running for review and report its URL. Do not push, publish or deploy changes unless explicitly requested.

## Validation and production build

```bash
npm run lint
npm test
npm run build
npm run preview
```

The production output is written to `dist/`. The workflow validates every `main` push and stores a `production-dashboard` artifact. GitHub Pages uses the repository path `/PMP_Project_Report/` when Pages is available and the repository variable `ENABLE_GITHUB_PAGES=true` is set.

Historical note: Pages was unavailable during the 2 October validation. Publication was subsequently verified at https://huydamdcmvn.github.io/PMP_Project_Report/. Deployment remains conditional on ENABLE_GITHUB_PAGES; access settings must not be changed implicitly.

## Data refresh

1. Replace the three controlled Excel snapshots in `RawSource/` without changing their expected sheet names.
2. Run `npm run data:build`.
3. Review the generated Data Quality page and relationship counts.
4. Run lint, tests and the production build.
5. Commit both the refreshed raw snapshot (if permitted) and generated JSON.

## Documentation

- [Dashboard architecture and wireframes](docs/dashboard-architecture.md)
- [Data model and relationships](docs/data-model.md)
- [KPI dictionary](docs/kpi-definition.md)
- [Risk rules](docs/risk-rules.md)
- [Design system](docs/design-system.md)

## Abbreviations

| Abbreviation | Meaning |
| --- | --- |
| DC | Digital Coordinator |
| DL | Digital Lead |
| DIG | Digital Team |
| MM | MEP Modeler |
| ML | MEP Lead |
| MEP | MEP Team |
| TRM | Transmittal |
| AUD | Audit |
| REV | Revise |
| CFM | Confirm |

## Project personnel

| Vi Trí | Name | Username |
| --- | --- | --- |
| Digital Lead | Huy Dam | `hu.dam` |
| Digital Coordinator | Long Dang | `lk.dang` |
| Digital Coordinator | Nhan Huynh | `nd.huynh` |
| Digital Coordinator | Khoa Doan | `kd.doan` |
| Digital Coordinator | Quy Ha | `qn.ha` |
| Digital Coordinator | Hung Nguyen | `ht.nguyen` |
| Digital Coordinator | Quan Nguyen | `qd.nguyen` |
| Digital Coordinator | Danh Nguyen | `dahn.nguyen` |
| COO | Frankie Imbrogno | `f.imbrogno` |
| MEP Lead | Lam Truong | `l.truong` |
| MEP Lead | Thuong Huynh | `tv.huynh` |
| MEP Lead | Nhut Le | `n.le` |
| MEP Lead | Sang Duong | `s.duong` |
| MEP Lead | Hanh Pham | `h.pham` |
| MEP Modeler | Binh Tran | `b.tran` |
| Other | Other | `bn.hoai` |
| Other | Other | `bnh.ext` |
| MEP Modeler | Cong Le | `c.le` |
| MEP Modeler | Duc Le | `d.le` |
| MEP Modeler | Dat Nguyen | `d.nguyen` |
| MEP Modeler | Danh Phan | `d.phan` |
| MEP Modeler | Dat Nguyen II | `da.nguyen` |
| MEP Modeler | Dang Nguyen | `dhn.nguyen` |
| Other | Other | `dq.nong` |
| MEP Modeler | Du Nguyen | `dv.nguyen` |
| MEP Modeler | Duong Quach | `dx.quach` |
| MEP Modeler | Huong Huynh | `h.huynh` |
| MEP Modeler | Huy Le | `h.le` |
| MEP Modeler | Ha Phan | `ha.phan` |
| MEP Modeler | Hoa Le | `hoa.le` |
| MEP Modeler | Ha Pham | `ht.pham` |
| MEP Modeler | Huy Tran | `ht.tran` |
| MEP Modeler | Khoa Mai | `k.mai` |
| MEP Modeler | Luc Nguyen | `l.nguyen` |
| MEP Modeler | Lam Pham | `l.pham` |
| MEP Modeler | Long Su | `l.su` |
| MEP Modeler | Nguyen Bui | `n.bui` |
| MEP Modeler | Nam Chau | `n.chau` |
| MEP Modeler | Nhat Dinh | `n.dinh` |
| MEP Modeler | Nhu Nguyen | `n.nguyen` |
| MEP Modeler | Ngoan Vo | `n.vo` |
| MEP Modeler | Phuc Tran | `pv.tran` |
| MEP Modeler | Thi Bui | `t.bui` |
| MEP Modeler | Toan Do | `t.do` |
| MEP Modeler | Thai Doan | `t.doan` |
| MEP Modeler | Truong Huynh | `t.huynh` |
| MEP Modeler | Trang Le | `t.le` |
| MEP Modeler | Trieu Luu | `t.luu` |
| MEP Modeler | Truong Tran | `t.tran` |
| MEP Modeler | Tam Trinh | `t.trinh` |
| MEP Modeler | Than Le | `th.le` |
| MEP Modeler | Tham Nguyen | `th.nguyen` |
| MEP Modeler | Thy Pham | `tk.pham` |
| MEP Modeler | Tan Doan | `tm.doan` |
| MEP Modeler | Thanh Nguyen | `tn.nguyen` |
| MEP Modeler | Trong Bui | `tt.bui` |
| MEP Modeler | Thoa Bui | `ttc.bui` |
| MEP Modeler | Tu Le | `tu.le` |
| MEP Modeler | Tuan Nguyen | `tu.nguyen` |
| MEP Modeler | Uyen Nguyen | `u.nguyen` |
| MEP Modeler | Yen Nguyen | `y.nguyen` |

## System ownership

| System | Person in charge | Username |
| --- | --- | --- |
| ELT/MSR | Hanh Pham | `h.pham` |
| RLT | Lam Truong | `l.truong` |
| SAN | Thuong Huynh | `tv.huynh` |
| SPR MED | Sang Duong | `s.duong` |
| HKG | Nhut Le | `n.le` |

## Security

No secret is required for the static dashboard. Never commit API keys, passwords, tokens or private connection strings. Local environment files are ignored; `.env.example` contains safe placeholders only.
