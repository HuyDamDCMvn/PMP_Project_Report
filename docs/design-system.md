# Design system

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Background | `#F4F6F8` | Application canvas |
| Surface | `#FFFFFF` | Panels and tables |
| Ink | `#17212B` | Primary text |
| Muted | `#667085` | Secondary information |
| Blue | `#1F5A94` | Informational/current-week state |
| Green | `#237A57` | Healthy/evidenced state |
| Amber | `#B26A00` | Attention required |
| Red | `#B42318` | Management intervention |
| Grey | `#7A828E` | Unknown/incomplete/historical |
| Border | `#D8DEE6` | Structural separation |
| Raised shadow | `0 8px 24px rgba(16,24,40,.09)` | Focused/actionable KPI elevation |
| Focus ring | `0 0 0 3px rgba(31,90,148,.22)` | Keyboard-visible focus |

Typography uses Inter/system sans-serif with 30 px page titles, 20 px section headings, 30–34 px KPI values, 14 px body text and 12 px metadata. Spacing follows an 8 px base with 4 px for compact internal gaps. Panel radius is 10 px; shadows are limited to `0 2px 8px rgba(16,24,40,.06)`.

Charts use semantic colour only. Labels, values and patterns remain visible without colour. Historical weeks are grey, the reporting week is blue with a dashed boundary and future weeks are neutral.

The current shell uses a 248 px desktop navigation rail, a fluid content column, and a compact sticky project context bar. At widths below 900 px the navigation and analytical grids reflow into a single-column reading order; below 640 px KPI cards use a two-column compact layout. Focus-visible rings and reduced-motion handling are shared across controls.

## Reusable components

Issues & Productivity replaces Team & Resource. Seven collapsible panels cover Uploaded Families, five traceable KPI cards, eight-week Created/Completed throughput, open aging, status, handler queues and recorded hours by work type. The former Issue filters panel is replaced by the shared full-width donut: total unique uploaded families in the center, One pass in green, Returned in red and Unclassified in grey. Outcomes come directly from Family_vs_Tickets.Rework_Outcome. Slice activation opens Family records; legends compose a Family outcome filter through direct ticket links into every applicable view. The How to read productivity panel is removed by user request; definitions remain in documentation. Blue marks show creations, green completions, amber open work and red age above 30 days. Counts open the shared searchable, sortable, infinite-scroll detail drawer. Separate labelled filter buttons compose status, handler, work type, issue state, age bucket and ISO activity week in shared state; chips and Reset Filters clear them. Week selection includes creation or completion in the selected week. Chart scroll stays local at narrow widths; KPI grids reflow 5/3/2 columns. Canonical handler names are displayed where supplied in AGENTS.md; other source usernames remain intact.

MIDP packages follow the user-approved project sequence: Framework deliverables, Revise the RFA library, Create Revit templates for each LPH, Sample Model + Output Data, Output Checklists, Export layouts to Revizto & 3D Review, Lesson Learned. This is a presentation order, not an ISO-mandated schedule or a change to source CW markers. New package types appear afterward alphabetically.

The standalone MIDP Reset Filters button is removed by user request. Active filter chips remain independently removable and the shared active-filter reset remains available.

MIDP lot-level Details buttons are removed by user request. Nonzero CW marks still open their supporting records; system and owner buttons retain cross-filtering.

The MIDP Source and scope disclosure and its explanatory paragraph are removed from the page by user request. Source definitions and calculation boundaries remain in project documentation and mark descriptions.

All MIDP series labels read Actual or Plan without unit suffixes. Upload/ticket units remain available in mark descriptions and source scope; calculations are unchanged.

MIDP row order is Actual above Plan for every lot. Actual marks remain blue; Plan marks use Grey soft with Ink text. Zero and future Actual cells are visually blank. Non-RFA rows use the concise label Actual; ticket units remain in mark descriptions and source scope, counting completed Positive/Re-Assessment Matrix tickets by source End Date, exact Work Type and unambiguous explicit system tokens in source summaries. This is not a completed-TIDP measure. Unknown-system tickets remain unassigned; no reporter fallback is used.

MIDP CW columns use thin 1px dashed grey grid boundaries from the shared Border token on headers and weekly cells. The reporting CW retains its stronger blue dashed boundary. Plan is rebuilt exclusively from RawSource/DCMvn_TIDP_Combined_20260930.xlsx, sheet TIDP_Combined.

MIDP uses paired Actual / Plan rows per lot. Plan retains authoritative weekly activity counts. Actual RFA counts unique exact-matched uploaded names per ISO CW at earliest Family End Date, within the snapshot. Nonzero counts open supporting records; blank cells do not prove incomplete work. The page title is Master Information Delivery Plan; redundant count and explanatory sentences above the Gantt are removed. Week headers stay on one line with local horizontal scrolling.

MIDP / TIDP is now a master Gantt table: collapsible major Work Type packages with System lots, owner labels, item counts and CW05–CW42 activity cells. Cells show source-marker work-item counts, not a fabricated continuous duration. Current CW has a dashed boundary. Headers and lot labels are sticky; narrow views scroll locally. System/owner buttons compose shared filters with removable chips and Reset Filters; Details/CW marks open the shared infinite-scroll evidence table without changing filters. Future team/batch inputs use the source-neutral MIDP aggregation contract documented in midp-extension.md.

Sidebar order starts with 00 MIDP / TIDP, followed by 01 Executive Overview. MIDP / TIDP is the default landing view when opening or reloading the dashboard. The other navigation identifiers remain unchanged.

Donut slices retain focus after closing details without the browser's default black outline. Keyboard focus-visible uses the existing bright slice stroke/glow instead; pointer hover retains the same highlight. Focus restoration and Enter/Space activation are unchanged.

All chart detail tables load 100 rows initially and append the next 100 when the user scrolls near the bottom. There are no page-turn controls. The sticky header, local scrolling, sort and column searches remain; sorting/searching resets the loaded window to the top. A compact footer shows loaded/total records.

Nonzero Plan and Actual node labels open the shared full-screen detail table for unique families accumulated through that CW, respecting current dashboard filters. Actual applies the earliest upload End Date and snapshot cutoff; Plan applies the first planned CW. Zero labels have no click handler or keyboard tab stop. Enter/Space opens details; Escape closes and restores focus.

Chart detail tables use a full-viewport responsive sheet. The title, close button and pagination remain visible; only the table body scrolls. Desktop columns wrap within the available width, with extra space for ticket/family names; narrow screens use a local horizontal scroll rather than shrinking text. Source/definition disclosure and the introductory record-scope sentence are removed from these sheets by user request; chart source disclosures remain unchanged.

The forecast legend reads Forecast; its dashed swatch conveys the projection style. The catch-up summary uses bold (700) blue text.

Executive Overview ends with Cumulative Family Progress by CW. The Current-week delivery by system and Open-ticket aging panels are removed from this view per user request; source data and other views remain unchanged.

Cumulative Family Progress by CW uses concise Plan / Actual / Forecast legends with solid/dashed swatches. Plan counts are grey above each node, with separate vertical offsets from blue Actual labels. Forecast is blue dashed with a hollow endpoint, a visible catch-up CW, and methodology in Source and weekly values. The axis expands beyond CW42 as needed; the planned final scope is held flat only for comparison. The former permanent End Date note is removed; provenance remains in the source disclosure.

Family progress has a thin dashed grey vertical grid per CW except the amber reporting-week marker. Each Actual node displays its cumulative upload count; alternating label offsets prevent neighbours from touching. Y-axis step defaults to 100 families and accepts integer steps 10–5000 using a labelled numeric input, independently of filters. The 1600px minimum canvas and content-driven plot height preserve readable ticks; horizontal/vertical scrolling stays inside the chart (75vh maximum region).

Family progress uses a grey plan line, blue actual-upload line and amber dashed reporting-week marker. Actual uses the user-confirmed Family End Date milestone, counting each normalized TIDP family once at its earliest recorded date. All CW05–CW42 ticks are displayed as two-digit week numbers under the CW/2026 axis title. A 1000px minimum chart canvas scrolls locally on narrow views to preserve label spacing. Actual stops at the snapshot, without future extrapolation. Weekly values and methodology remain available in the source disclosure.

Chart panels additionally support an unobtrusive 44px bottom-right resize handle without Width/Height dropdowns. Pointer/touch dragging adjusts grid width (4–12 of 12 columns) and chart-content height (200–900px, constrained to 85vh); content scrolls locally where needed. Arrow keys resize, Home/Enter or double-click restores that chart's automatic fit. Saved drag sizes persist by page/chart id across filtering and navigation. Narrow-screen stacking overrides manual widths, without deleting the desktop preference. Collapse state, filters and exact values remain unchanged by resizing.

Dashboard content automatically uses the complete available workspace width with a 12-column grid, without the former 1720px cap. Per the latest user request, manual Width/Height controls and Reset Layout are removed; saved manual sizes are no longer read. Charts and paired panels share columns on wide screens and stack below 1100px. Heights follow content rather than fixed limits; wider chart containers place legends beside the chart. Collapse/expand and cross-filter states remain independent of automatic sizing. Long tables retain their internal scroll region.

The former family-coverage KPI is replaced by a collapsible Positive Tickets by Reporter donut with exact counts, percentages, and a keyboard-accessible Reporter cross-filter legend.

Ticket Count replaces the open-ticket KPI with an all-status ticket composition donut. Positive includes Re-Assessment and shares the Active cross-filter with Ticket Hours. The six Work Type ring slices interleave large and small categories to separate small-slice anchors; the legend retains descending hours order and category colors.

Donut charts display external labels aligned in two edge columns with orthogonal leader lines and horizontal shoulders. Leaders exit horizontally to separate routing lanes outside the donut, then turn vertically to evenly spaced label rows; horizontal segments and shoulders are parallel, with no diagonal fan across the chart. Labels are sorted by slice anchor height on each side; each shows category, exact value, and share. Small nonzero shares below 0.1% display `<0.1%`. A wide SVG viewBox reserves label space; interactive legends sit below the chart and retain full Work Type names.

The annotated chart canvas is capped at 900 px and scales to its container. Left labels are offset further outward; orthogonal routing lanes follow anchor/label order to avoid line intersections. Multiple label rows span above and below the ring. Legends stack below 640 px.

Executive composition charts use SVG donut charts with exact totals in the center, keyboard-accessible filter legends with counts and percentages, and native details/summary collapse controls. Green represents uploaded/Positive, amber represents unmatched upload names, red represents Negative, and blue represents Re-Assessment. The two panels stack below 1100 px; donut and legend stack below 480 px. Source definitions are available through a nested disclosure.

- Application shell and sidebar
- Top filter bar and visible filter chips
- KPI card with definition/evidence state
- Health strip
- Management attention item
- Status badge
- Horizontal ranking bar
- Stacked composition bar
- Weekly heatmap
- Schedule timeline
- Dependency matrix
- Searchable/sortable/paginated data table
- Detail drawer with breadcrumb and source trace
- Data-quality indicator and issue list
- Empty/evidence-gap state

## Coordinated cross-filter interaction

- Uploaded Families omits the Unclassified slice/legend only when its count is zero. If a later source update contains missing outcomes, the grey category appears again automatically.

- Issues & Productivity panels reuse the persisted chart-resize control: drag or use arrow keys, and press Home/Enter to restore automatic size. Narrow containers reflow KPI cards; resized bodies scroll instead of clipping. Zero-record detail buttons are disabled, and missing recorded hours display an em dash rather than a measured zero.

- Every filterable KPI value, chart mark, heatmap cell, matrix cell, table value and legend item participates in one shared filter state.
- Selecting a value in one component filters every other component whose dataset has a valid relationship to that dimension. Components therefore act as both filter inputs and filtered outputs.
- Filters from different components compose as an intersection. A new selection must not remove unrelated active filters.
- Selected marks use a visible selected state that does not rely on colour alone. Every active selection also appears as an independently removable filter chip.
- Re-selecting an active value toggles it off. Removing a chip or choosing `Reset Filters` synchronizes the cleared state across all components.
- A component with no records after filtering renders an explicit filtered-empty state. It must not fall back silently to unfiltered data.
- Expand/collapse, sorting, pagination, help, source trace and detail-opening controls remain separate from filtering unless their filter action is explicitly labelled.

# Grouped Issues and Productivity dashboard

One Issues & Productivity sidebar page contains two independently collapsible groups, Issues and Productivity. Native disclosure headers remain visible when closed and support keyboard operation. Both groups start expanded; their in-session open/closed states survive filtering and navigation without changing inner panel states. Each group has its own responsive 12-column layout, retaining existing panel resize preferences.

Both groups use the shared collapsible/resizable analytical panels, evidence drawer and coordinated filter chips. Summary cards use four columns at desktop widths, three below 1200px, two below 640px, with existing container-query fallback to one column. Weekly charts share the same zero-baseline geometry; narrow layouts scroll the chart locally. Zero observations have no bar height. Issues uses the existing rework donut; Productivity emphasizes weekly Family uploads and recorded effort without conflating their units.
