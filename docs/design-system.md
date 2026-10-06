# Design system

CFM Forecast now uses the regression slope of four complete cumulative weeks, anchored to the current Actual CFM and capped at Plan. Summary and chart disclosure name the method and window; marks retain rounded estimated labels and noninteractive forecast semantics. Other series, sizing and filters remain unchanged.

Latest user override: remove the separate Uploaded Families chart and Source review panel. TIDP Family Upload now compares all-project uploads (2,002) with the planned total (2,295), displaying an arithmetic remainder (293), not unmatched-name coverage. Linked coverage remains 2,001/2,295 in chart notes. CFM legend reads Actual CFM; the prominent provenance banner is removed, with source lineage retained in detail/docs. Weekly linked issues uses Total issues as the sum of all nine error-flag series; its detail contains one row per Family/error flag.

Executive Overview begins with an Uploaded Families panel using the same all-project upload cohort as Productivity. Its center is total uploaded Families; linked/unlinked TIDP slices open Family evidence without applying a new filter. The existing TIDP Family Upload panel remains a separate planning-coverage measure. Both panels reuse the shared collapsible/resizable donut component; no new visual tokens are introduced.

Project Goals uses a subtle white-to-Blue-soft gradient (--goals-surface), 16px corners (--goals-radius), Blue left accent and shared raised shadow. Each goal has a 32px circular navy/blue numbered badge (--goals-badge-size), with sparse dividers and comfortable spacing. Responsive 20–26px title and 14–17px body remain readable. The native disclosure retains a circular plus/minus cue and reflows below the MIDP title on narrow screens; source wording is unchanged. Decorative styling is static, without shimmer or distracting motion.

MIDP heading includes an initially expanded native Project Goals disclosure with the five user-supplied goals, wrapping below the title on narrow viewports. Sidebar copy reads Snapshot recorded at 16:00 on dd.mm.yyyy; this user-supplied capture time does not change calculation cutoffs or claim exact API reconstruction. Generated timestamp stays in dataset metadata.

Cumulative Family Progress detail tables show direct linked Ticket IDs in their first column, not TIDP row IDs relabelled as tickets. Multiple IDs are retained once in numeric order; unlinked Plan Families show an em dash. Nonzero MEP Transmittal labels are keyboard-accessible detail actions, using the same cumulative Actual_TRM evidence as their points.

Cumulative Family Progress omits zero numeric labels from Plan and Actual Uploaded as well as MEP Transmittal. Zero values, baseline points, axis ticks, weekly tables and exports remain unchanged.

MEP Transmittal displays exact cumulative numeric labels at every nonzero actual week. Zero labels are omitted; points retain their exact accessible counts. Labels hide/show with the series legend and do not change values.

Cumulative progress labels its blue legend Actual Uploaded (calculation remains Actual_CFM). Visible/Hidden text is removed; hidden-series buttons have dashed borders, shown-series buttons solid borders, with aria-pressed and Show/Hide accessible names retained. This supersedes the earlier strikethrough/status-text presentation.

Cumulative Family Progress legend buttons toggle Plan, Actual, MEP Transmittal and Forecast independently, including their marks and labels. aria-pressed, Visible/Hidden text and strikethrough expose visibility. This presentation state survives in-session rerenders/navigation/collapse; calculations, filters, axis range, evidence table and CSV stay unchanged. Hiding all four shows a recovery message.

Cumulative Family Progress adds a solid Green MEP Transmittal line from Actual_TRM, alongside solid Blue Actual from Actual_CFM. Grey Plan and its legend sample are dashed. Green points open dated Family evidence; the reporting-week count is labelled, with every week's exact count accessible on its point and in the weekly table/CSV. Existing collapse, sizing and filter scope are retained.

Update data is now enabled, including narrow viewports. Loading disables repeat requests and displays an aria-live message. Success or failure is explicit; existing data remains until all downloads validate. Snapshot and generated timestamp are separate. No filters or presentation settings are reset.

The sidebar footer reserves an Update data button above the snapshot note. It is disabled and labelled Coming soon until the update workflow is implemented; it performs no refresh, filter or remote action. The button wraps within the responsive sidebar and has a 44px minimum height.

Error legend explanations use the user-provided detailed English definitions, including examples of geometry, connector, parameter, graphics, naming, category/template, audit metadata and Revit-version errors. Other_Unclear means a return outside the other eight categories. These shared explanations do not change source X classifications or counts.

Weekly linked issues defaults to a Y-axis step of 5 counts. The editable control retains its existing range and changes grid spacing only, never the data.

Weekly label placement excludes blank grid-only primary series from collision reservations. Overlay labels prefer a nearby slot above their own point, rather than reserving phantom baseline labels that push low-value labels far up the plot. The Data Quality navigation index is 04.

Chart explanation titles and legend definitions are in English: Chart purpose and legend definitions, Purpose and how to read this chart, and Legend definitions. This applies to all shared chart disclosures and source-label definitions.

Chart disclosures use Mục đích và định nghĩa legend. Donuts share an explicit definition list generated from their actual slices, with source-backed outcome/classification/error meanings and a dimension/unit fallback. Existing scope, calculations, source trace and interactions remain available. Source X flags describe supplied classifications, not inferred defects.

Weekly linked issues has a Show/Hide numeric labels button beside its Y-axis step. Labels default hidden regardless of visible-series count; this local presentation state survives rerenders and does not filter or change values. Label placement uses the shared collision allocator. Point hover backgrounds stay transparent, with keyboard focus retained. The panel subtitle is removed; scope remains in Chart purpose and parameters.

Weekly linked issues starts at CW20 and uses the same familyProductivity weekly upload cohorts as Weekly Family uploads. A dashed Ink Uploaded Families reference reconciles each actual week; error lines retain source X counts, which must not be summed as unique uploads. No error forecast is fabricated. The separate Weekly values by error type disclosure is removed; keyboard-accessible points retain counts and evidence. This supersedes the earlier last-eight-week/weekly-value notes. The shared renderer accepts minCanvasWidth to preserve the 1760-unit Productivity format across different week counts.

Weekly error legends now toggle local line visibility, not shared data filters. Visible/Hidden text, aria-pressed and strikethrough make the state explicit. In-session visibility survives navigation, collapse and axis/filter changes; Reset Filters leaves this presentation setting intact. The error chart matches Weekly Family uploads' 1760-unit canvas and 250-unit plot (dense Y ticks expand locally), common typography/grid/month rows and default step 25. Up to three visible lines show numeric labels; denser selections use node tooltips and the weekly-value disclosure to avoid overcrowding. Hiding every line shows a recovery message while retaining the axis control and legends.

05/10/2026: Returned-error donut legends use two columns, three at container widths >=950px, one below 450px. Weekly linked issues replaces Created/Completed with nine error-type series, preserving the last-eight-week axis and month row. Shared overlay rendering accepts fixed color/dash styles and point-centered evidence targets instead of crowded permanent labels. Legends cross-filter; keyboard/hover exposes counts and nodes open Family evidence. Weekly grouping uses Family upload End Date, not ticket creation, completion or error-discovery time.

05/10/2026: Heatmap cells now open Family evidence directly (including explicit zero-record details), without applying filters. The separate Details text and panel subtitle are removed; row/column filter controls remain. System row labels include the canonical AGENTS.md owner below. Returned-error donut uses a stacked chart/legend layout, a 1100px maximum canvas with wider label gutters, and scoped SVG label/value tokens 2.6/2.4 units. Other donuts and all calculations are unchanged.

Returned errors by System uses a locally scrollable heatmap: System rows, source-error columns, exact numeric flags, shared blue intensity levels and separate evidence buttons. Row/column/cell filters compose in shared state; cells select errorSystem plus reworkError. Multiple/unknown linked systems are explicit buckets, not duplicated counts. The shared panel supplies collapse and resize. Weekly linked issues uses a 1760-unit canvas with a 250-unit minimum plot, matching Productivity typography/grid geometry; both Created and Completed legends are visible and the independent Y-axis step defaults to 25 tickets.

Issues removes Issue pulse, Open issue aging, Issue status and Open issues by handler. Weekly linked issues now shares the line renderer (Created blue, Completed green, last eight ISO weeks, month row and count evidence). Weekly hour/effort time labels are non-filter text. Numeric label placement reserves clearance from data points as well as neighbouring labels. Returned error donut preserves all nine source X columns; multi-label counts are error flags, not mutually exclusive ticket counts. The legend composes reworkError filters with shared state; slices open Family evidence.

Average Family effort now rounds source ticket and net ticket/person hours to the nearest quarter hour before aggregating. Labels retain two-decimal averages and the common weekly-upload denominator. Other chart metrics are unaffected.

Family-effort blue, orange and green lines share the exact weekly-upload count as denominator. Role labels and detail headers reflect contributions per uploaded Family; complete zero role hours display zero without changing upload count or filters.

All weekly line charts show the shared ISO-Thursday month row: cumulative progress, weekly uploads (including forecast), average Family effort, and weekly project hours. Week controls, month bands and year caption occupy separate rows; values and filters remain unchanged.

Shared project titles use --project-title-size (20px); page report eyebrows use --report-eyebrow-size (14px), across all dashboard pages. Numeric chart labels have transparent hover backgrounds while keeping visible keyboard focus. Role series now display permanent 12px numeric labels through the shared collision-aware placement pass, recalculated after axis changes. Orange label text uses --role-label-orange (#9c5b00). The separate Role averages calculation disclosure is removed; definitions remain in KPI documentation. This supersedes the earlier no-permanent-label contract below.

Average Family effort supports two additional series using the shared renderer's overlay configuration. MEP Modeler uses the existing amber/orange token and a solid line; Digital Coordinator uses green and a dashed line. A text legend names all three series. Group marks expose exact two-decimal values through keyboard-accessible detail buttons without adding crowded permanent labels. All series share the Y-axis control and CW20–CW43 horizon. The original blue Matrix series remains unchanged.

Weekly Annotation Project hours adds a noninteractive month band below CW labels. Weeks are assigned to the month containing their ISO Thursday; contiguous weeks share a centered English abbreviated month label. The SVG reserves additional bottom space so month names, week controls and the year caption remain distinct. This presentation-only option is parameterized in the shared line renderer; weekly values and filters are unchanged.

Weekly upload Y-axis step defaults to 25 Families; weekly project hours defaults to 200 hours. The shared weekly-hour line renderer recomputes label rectangles after scaling, reserves the Y-axis tick gutter, and searches nonoverlapping vertical slots for neighbouring numeric targets. Dense tick ranges increase local plot height to retain 20-unit tick spacing instead of crowding axis text. Numeric precision and drill-downs remain unchanged.

All chart interpretation disclosures are labelled Chart purpose and parameters (with weekly values retained for the cumulative chart). They explain the decision purpose, units, axes or composition, colors, calculations and interaction boundaries. Weekly line-chart standalone partial-week footnotes are removed; the amber marker and interpretation disclosure retain snapshot context. Average Family effort has an independent Y-axis step control (default 5 h/Family, range 0.25–100, increments 0.25); weekly project hours uses default 500 h (range 10–5000, increments 10). Controls persist in view state across filters/navigation and change only grid spacing, not observations or cross-filters.

Chart ordering: the separate ↑ ↕ ↓ toolbar is removed. The existing panel title is a plain-looking native 44px-minimum button inside its heading: drag the title with pointer/touch or focus it and use arrow keys. Home on the title restores that group's default order. Hover/focus exposes concise instructions; moving never activates collapse. A blue target outline identifies a valid drop; a live status announces positions. DOM order (not only CSS order) changes, preserving reading/tab order. Order persists in localStorage per page/group and survives filters/reloads. Productivity and Issues retain independent groups; charts cannot be moved across pages or groups. Reordering moves existing nodes without changing values, filters, collapse, details, or resize settings. Narrow screens stack the same saved order. No external libraries or remote writes are involved.

Average recorded hours per Family by week reuses the parameterized progress-line renderer, blue marks, numeric drill-downs, upload-week cross-filter labels and collapse/resize contracts. Its axis spans CW20–CW43, aligned with Weekly Family uploads; actual averages group Families by their original upload End Date through CW40. Future weeks remain blank without fabricated averages, and the partial-week marker stays at CW40. The subtitle, standalone missing-hours note and single-series legend are omitted; definitions remain in Chart notes. Unknown historical averages display a dash and break the line, while measured zero remains a point. A two-decimal display does not alter underlying averages or export ticket values.

Weekly Annotation Project hours uses the shared progress colors, grid, local scrolling, numeric detail buttons and partial-week marker. `renderWeeklySeries` is a parameterized presentation primitive separate from API/time rules; zero and negative values remain exact. Forty week labels expand the local canvas without page overflow. Nodes do not filter; CW labels compose `spentWeek` and numeric labels open net ticket-week hours in the shared sortable/exportable drawer. The panel uses existing collapse/resize behavior and has explicit unavailable/incomplete/filtered-empty states.

## Tokens

Average Family hours and Weekly Family uploads share a 70-unit CW spacing and 1200-unit minimum SVG canvas, with the same inherited Inter/system font, 12-unit axis text and existing numeric-button typography. This keeps both CW20–CW43 charts at the same visual text scale for equal panel widths; local scrolling preserves readability in narrow panels. The shared renderer accepts weekSpacing; the longer project-hours timeline retains its existing spacing. Data, precision, filters and detail actions are unchanged.

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

The initial loading screen displays the same public/logo.svg asset as the sidebar, with a responsive width capped at 220px and meaningful alternative text. Vite's base URL resolves the asset for local and GitHub Pages previews. The error indicator remains unchanged.

Every HTML table exposes a keyboard-accessible `Export CSV` button: each MIDP package, cumulative weekly values, all shared chart/Issues/Productivity detail drawers, and paginated record tables. Export uses the table's complete filtered and sorted result, never its rendered 100-row window or page. Columns follow table header order; MIDP repeats merged lot metadata on Actual and Plan rows and preserves blank zero/future cells. UTF-8 BOM, quoted fields, CRLF records and formula-injection protection support spreadsheet import. Empty results export headers only. Export is local and does not change filters, selection, sorting, collapse or navigation state. Snapshot-dated filenames identify the table. Shared implementation lives in table-export.js; no DOM scraping of paginated rows.

Positive Tickets by Reporter uses the concise disclosure “Ticket counts are based on positive tickets, grouped by reporter.” Its redundant as-of/filter guidance paragraph is omitted via the shared pie panel's optional source-context setting; other charts retain their context. Source classifications (including Re-Assessment as Positive), totals, reporter filtering and the global snapshot banner are unchanged. Full methodology remains in kpi-definition.md.

Temporary equivalence policy (04/10/2026): preserve current layout, resize/collapse behavior and source ticket-number column. TIDP upload composition, cumulative Actual/Forecast and MIDP weekly RFA Actual consume the same generated familyId links. The TIDP upload donut labels unmatched Families `Not Yet Upload`; its Chart notes explain the center total, green Uploaded slice, amber unmatched slice, percentages and interactions. This label means no linked upload at the snapshot under the approved mapping policy. Technical provenance stays in project documentation. Plan markers and original Family identities remain unchanged. This supersedes exact-name-only descriptions below.

Only the `TIDP Family Upload — Uploaded` detail table includes `Ticket number` between Owner and Work type. Values retain the matched Family's direct source Ticket_IDs (unique, numerically ordered, comma-separated); absent links show an em dash. The existing column search, descending-first sort, sticky header and local scroll apply. Not uploaded and all other detail tables retain their existing columns and populations.

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

Chart detail tables use a full-viewport responsive sheet. The title, close button, Export CSV and record count remain visible; only the table body scrolls. Desktop columns wrap within the available width, with extra space for ticket/family names; narrow screens use a local horizontal scroll rather than shrinking text. All shared detail tables omit the Source and definition disclosure and introductory record-scope sentence by user request, including chart, MIDP, Issues and Productivity drill-downs. Chart-level source disclosures remain unchanged; filters, sorting, exports and data are unaffected.

The forecast legend reads Forecast; its dashed swatch conveys the projection style. The catch-up summary uses bold (700) blue text.

Executive Overview ends with Cumulative Family Progress by CW. The Current-week delivery by system and Open-ticket aging panels are removed from this view per user request; source data and other views remain unchanged.

Cumulative Family Progress by CW uses concise Plan / Actual / Forecast legends with solid/dashed swatches. Plan counts are grey above each node, with separate vertical offsets from blue Actual labels. Forecast uses the brown token #86542d for its dashed line, hollow endpoint, catch-up summary and projected table values. The weekly table combines Actual / Forecast: measured values through the snapshot, then rounded projections with an explicit (Forecast) suffix. CSV includes a Value type field to preserve the distinction. The four-complete-week forecast calculation is unchanged. Methodology remains in Source and weekly values. The axis expands beyond CW42 as needed; the planned final scope is held flat only for comparison. The former permanent End Date note is removed; provenance remains in the source disclosure.

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

Uploaded Families by uploader reuses the shared donut renderer: total unique uploaded Families in the center, uploader counts and shares in slices/legend. Slices open Family evidence; legends compose the source uploader filter. The Linked effort by handler panel is removed; KPI and weekly upload/forecast chart remain unchanged.

Weekly upload Actual nodes are noninteractive circles: clicking a node does not filter or open records. Numeric labels retain detail opening; CW axis labels retain the explicit week filter. Forecast remains noninteractive.

Weekly uploads includes a brown dashed Forecast through CW43, derived as successive increments of the shared cumulative catch-up scenario (four complete weeks, partial reporting week excluded, capped at scoped TIDP planned total). Brown rounded labels are noninteractive estimates; Actual values and filters remain unchanged. Productivity's four KPI supporting notes and weekly-chart subtitle are omitted by user request; calculation definitions and missing-hours limitations remain in kpi-definition.md.

Productivity weekly uploads starts at CW20 and ends at the snapshot week, including zero-upload weeks. Its independently retained Y-axis step control defaults to 50 Families, accepts integers 10–5000, and does not alter data or filters. The standalone click-guidance sentence is removed. Wider CW ranges expand the internal canvas to preserve label spacing, with component-local scrolling.

Weekly Family uploads shares Overview's progress-chart styling: blue Actual line and values, horizontal numeric grid, dashed vertical CW grid, amber reporting-week marker, two-digit CW ticks, named axes and full-width canvas with local scrolling below 1000px. It retains weekly (not cumulative) values, count drill-downs, point/week filters and the partial-week note. The shared progress CSS owns these styles; no Plan or Forecast is added to this weekly chart. Reconciliation tests compare each weekly count with the difference between consecutive Overview cumulative Actual counts under the approved equivalence policy.

All chart interpretation disclosures use Chart notes (or Chart notes and weekly values for the cumulative chart). Notes explain the chart's question, units, colors, totals/shares or axes, and filter/detail interactions in plain English. Technical workbook/build descriptions remain in data-model.md and kpi-definition.md. Shared donut and panel renderers apply this contract to Overview, Issues, Productivity and Data Quality charts. Counts, classifications and calculations are unchanged.

Forecast points after the reporting snapshot show rounded brown value labels below the projected line, separated from grey Plan labels above it. These labels have no button role, tabindex or drill-down attributes; clicking them does not open evidence records.

One Issues & Productivity sidebar page contains two independently collapsible groups, with Productivity first and Issues afterward. Native disclosure headers remain visible when closed and support keyboard operation. Both groups start expanded; their in-session open/closed states survive filtering and navigation without changing inner panel states. Each group has its own responsive 12-column layout, retaining existing panel resize preferences.

Both groups use the shared collapsible/resizable analytical panels, evidence drawer and coordinated filter chips. Summary cards use four columns at desktop widths, three below 1200px, two below 640px, with existing container-query fallback to one column. Weekly charts share the same zero-baseline geometry; narrow layouts scroll the chart locally. Zero observations have no bar height. Issues uses the existing rework donut; Productivity emphasizes weekly Family uploads and recorded effort without conflating their units.

05/10/2026: Data Quality is removed from navigation and page rendering. Shared donut leaders now use short radial exits followed by diagonal fans to height-sorted, evenly spaced label rows and short horizontal shoulders. This supersedes the orthogonal lane routing above and separates tiny adjacent slices without changing their values or interactions.
The Reporter and returned-error rings interleave largest and smallest slices to separate tiny-slice anchor points; legend order and per-category colors stay unchanged.
Label rows stay close to natural anchor heights and enforce at least nine SVG units of spacing when capacity permits, capped within the existing canvas; this replaces evenly spreading all rows.

05/10/2026: All donut leader segments and shoulders run parallel to the X or Y axis, with right-angle bends only. Separate outer routing lanes replace diagonal/radial fans. Height-sorted label spacing and interleaved small slices remain; counts, colors, legend order and interactions are unchanged. This supersedes the diagonal-fan note above.

Average uploads / day detail table alone replaces Family ID with Ticket ID from the Family source ticketIds. Multiple linked IDs remain comma-separated within one Family row; missing IDs display a dash. Search, sort and CSV use the displayed ticket IDs, preserving the Family record count.

All donut outer category labels and value/share labels now match their corresponding legend font sizes in screen pixels. A shared ResizeObserver recalculates SVG text scale and measured label gutters after resizing or expanding. Long labels retain their full text and readable size using chart-local horizontal scrolling when necessary. Orthogonal leaders, record values and interactions stay unchanged.

All panel header collapse controls use Collapse while expanded and Expand while collapsed, including the shared donut panels on every dashboard. Native details state controls the visible text; the former Details plus/minus label is removed.

MIDP sidebar label is MIDP. Its tracking panel title is Master Information Delivery Plan Overview Tracking; the page heading remains Master Information Delivery Plan.

MIDP Items cells expose a hover tooltip describing the planned TIDP row count, work-package/team/lot scope, active-filter boundary, source workbook/sheet and once-per-row rule regardless of repeated weekly markers. The total spans Actual and Plan and does not represent completion or uploads.

MIDP Items tooltips explain only the meaning and counting method, including group/filter scope and no double counting across weeks. File names and source references are omitted from the tooltip.

User layout persists across reloads/reopens in the same browser and site: last active dashboard, panel/group/package collapse state, axis steps, error-series visibility and numeric-label visibility. Existing chart-order and chart-size storage is retained. Record filters are excluded. Invalid or unavailable storage falls back to defaults; narrow viewports continue to reflow saved desktop layouts.

Issues adds a collapsible/resizable Returned tickets by number of error types donut using the shared orthogonal leaders, legend-sized labels, cross-filters and ticket detail drawer. Returned-error donut and every returned-error heatmap detail replace Family ID with Ticket ID, preserving one row per Family and comma-separated links. The heatmap adds a bold Total row per error column; each total opens its scoped Family evidence. Layout preferences remain compatible.

Returned errors by System row labels and owner names use bold weight 700 and are centered horizontally and vertically within their cells.
The heatmap Total row label is centered horizontally and vertically within its cell.
All numeric cells in the heatmap Total row use explicit bold weight 700 on their evidence buttons.
Weekly linked issues legend uses five columns (two rows for ten series) on wide containers; existing two/one-column responsive layouts remain for narrow containers.
Returned-error donut legend uses four columns at container widths >=950px (two balanced rows for eight types), two columns below that and one below 450px. Count and percentage align together on the right of each item.
Weekly Family uploads: numbered accessible context markers at CW30 (Miramas reassignment) and CW36 (Munich RE / EKB returning work), with visible notes below the chart. User-supplied context does not change measured counts.
Upload context annotations use English text, 14-unit radius pale green markers (#dcfce7), dark green text (#14532d), and 15-unit bold numbers.

## Arithmetic donut interaction — 6 October 2026

Legend actions explicitly distinguish detail-only, filter and disabled presentation. The arithmetic remainder opens a one-record summary, has no aria-pressed state, and does not create a cross-filter. SVG and legend detail actions share the drawer handler; native buttons retain native Enter/Space activation. Escape restores trigger focus. Uploaded remains a real filterable cohort.

## Upload detail and weekly hours forecast — 06 October 2026
The amber upload action now opens one row per distinct planned RFA key without an eligible linked upload in the selected evidence; it retains original TIDP title, System, Owner and first planned CW. No-filter list count is 294, distinct from the unchanged arithmetic remainder 293. The table shares sorting, search, scrolling and full CSV export. Absence of a linked record is not proof of absence on the webapp.
Weekly project hours adds a dashed brown OLS linear-regression forecast for CW41–CW43 fitted to scoped weekly hours over CW22–CW39, excluding user-designated outlier CW36. Predictions use the fitted intercept and slope and are floored at zero; partial CW40 is excluded from fitting. CW36 remains visible in actual data and recorded-hour totals; only its regression input is excluded. Partial CW40 remains actual only. Future observations are null; forecast marks are noninteractive and do not contribute to recorded-hour totals. A single spent-week selection disables the scenario. Existing panel sizing/collapse and local scrolling remain in use.

The weekly hours forecast includes the observed CW40 point as a visual connector to CW41. This anchor has no duplicate forecast label or forecast evidence action; CW41–CW43 predictions remain fitted-intercept OLS values.

Weekly linked issue detail tables display Ticket ID instead of generated Family ID. Each Family/error-flag remains one row; multiple direct Ticket IDs share the same cell, preserving the error-count denominator and full export.

User decision 06/10/2026: assign error responsibility for Family 420_PF_CS_cCap_Mapress / Ticket 72176 to HKG — Nhut Le. The heatmap and shared errorSystem selection use the same stable-key mapping. No TIDP equivalence is restored, no authoritative workbook is changed, and total error flags remain 1116. Other unknown Families retain Unknown system.

User decision 06/10/2026: classify Family 434_PF_CO_cCap_MapressFKMBlue / Ticket 72578 as Returned. Scope is the distinct stable Family key and direct Ticket ID; original blank outcome remains in the dataset/workbook. Effective upload outcomes are One pass 1500, Returned 502, Unclassified 0. This ticket has zero classified error types; error flags remain 1116. Family identity, dates, hours and TIDP equivalence are unchanged.
