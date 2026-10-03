---
name: pmp-dashboard-ui-ux
description: Design, implement, audit, or refine the PMP Dashboard UI in this repository. Use for dashboard layout, responsive sizing, collapsible panels, filters, KPI cards, charts, tables, detail drawers, accessibility, interaction states, visual consistency, or browser verification. Do not use for unrelated websites or generic marketing pages.
---

# PMP Dashboard UI/UX

Build a dense, traceable management dashboard for the PMP Dashboard repository. The governing concept is **Decision → Evidence → Action**: surface management signals first, make every meaningful count traceable to its records, and keep the next action clear.

This skill adapts the useful dashboard patterns from `ayla-saas-admin-ui-ux-pro`, the quality workflow from `ui-ux-kit`, the information-density, provenance, and pre-ship practices from `shareout`, and the composable shell/component patterns from `shadcndashboard/shadcndashboard` to this project's actual design system, data rules, and Vite implementation. Project rules and existing approved documentation override every source kit.

## Read before editing

Read the smallest relevant set before making changes:

1. Always read `AGENTS.md`, `docs/design-system.md`, and `docs/dashboard-architecture.md`.
2. Read `docs/data-model.md`, `docs/kpi-definition.md`, and `docs/risk-rules.md` when a UI change affects values, labels, filtering, evidence, risk, status, or drill-down behavior.
3. Inspect the existing implementation and preserve working information architecture, filter state, source traceability, and established component behavior unless the request changes them.
4. Treat the three authoritative workbooks and the Family project filter in `AGENTS.md` as invariants. Never let a visual change reinterpret authoritative data.

## Project design direction

Read this as a responsive dashboard/admin/data surface for project leadership and delivery teams: corporate-clean, information-dense, evidence-led, restrained in motion, and built with the repository's existing Vite/vanilla JavaScript stack.

- Preserve the palette, typography, spacing, radii, shadows, and semantic meanings in `docs/design-system.md`. Do not replace them with Ayla's literal colors, Public Sans, fixed 1920 px canvas, or fixed 1560 px grid.
- Reuse one shared token layer. New visual values must become documented tokens rather than isolated literals.
- Use semantic colors consistently: blue for informational/current-week, green for healthy/evidenced, amber for attention, red for management intervention, and grey for unknown/incomplete/historical.
- Color never carries meaning alone. Pair it with text, iconography, shape, pattern, or status wording.
- Prefer spacing, grouping, subtle surface contrast, and sparse dividers over outlining every section. Cards are for genuine hierarchy, not every content block.
- Use one coherent icon family already available to the project. Do not mix icon styles or use emoji as structural controls.
- Treat `shadcndashboard/shadcndashboard` as an architectural reference, not a theme or framework mandate. Do not copy its React, Tailwind, shadcn/Base UI, Recharts, icon, font, or dependency choices into this vanilla JavaScript project unless the user explicitly authorizes a stack change.

## Dashboard narrative and density

The first visible viewport should communicate the dashboard's story within roughly five seconds.

- Order information from **summary → context/trend → operational detail**, while preserving this project's stronger **Decision → Evidence → Action** sequence.
- Put the most important and actionable information toward the top-left. KPIs and management attention must appear before supporting charts and detailed tables.
- Keep the primary KPI set focused, normally four to six metrics. Move secondary measures into contextual panels or drill-down views rather than creating a wall of equal cards.
- Keep a page to roughly 8–12 meaningful widgets unless the information architecture clearly requires more. A widget exists only if it answers a decision question.
- Give each chart one primary insight. Split overloaded visualizations instead of combining unrelated measures, axes, and legends.
- Provide context for headline values: comparison period, target, trend, rank, evidence status, or explicit statement that no valid comparison exists.
- Use progressive disclosure: headline signal first, exact value and definition on interaction, then a filtered record list or detail view for complete evidence.
- Distinguish current reporting state, historical periods, and future plan visually and textually. Do not use a generic “Live” badge, pulse, or freshness claim unless the data is actually live.
- Keep critical KPIs and management attention above the fold on common laptop viewports without shrinking them below readable sizes.

## Responsive viewport contract

The dashboard must fit the available browser viewport without unintended page-level horizontal overflow or clipped information.

- Use fluid containers, CSS Grid/Flexbox, `minmax()`, `clamp()`, and content-driven breakpoints rather than scaling a fixed desktop canvas.
- Large screens may use the full navigation rail and multi-column dashboard grid. Medium screens reduce gutters and column count. Narrow screens use a compact/off-canvas navigation pattern and stack primary content.
- Test both width and height. The main dashboard shell, fixed/sticky controls, drawers, menus, and expanded panels must remain usable at 375, 768, and 1280+ px widths and around 700 and 800 px viewport heights.
- Keep scrolling local to the component that needs it. Wide tables may use an accessible internal scroll region or a deliberate compact/mobile representation; they must not force the whole page wider than the viewport.
- Floating menus, tooltips, date pickers, and drawers must flip, shift, resize, or scroll to stay inside the viewport.
- Reserve layout space for asynchronous content and media to avoid cumulative layout shift.
- Load above-fold summary content before secondary visualizations. Lazy-load below-fold or expensive widgets when doing so does not break filtering or traceability.

## User resizing and automatic content fitting

- Allow users to adjust the width and height of dashboard components through visible resize handles or labelled size controls. Provide keyboard and touch alternatives to dragging.
- Define useful minimum sizes and constrain maximum sizes to the available container/viewport. Reflow neighbouring components without overlap, clipped controls, or page-level horizontal overflow.
- Automatically fit text and numbers to the component's actual content area whenever its size changes, including manual resizing, viewport changes, and expand/collapse. Use container queries and fluid typography tokens where suitable; use measured fitting only when CSS cannot satisfy the content.
- Preserve the visual hierarchy between title, KPI value, labels, and supporting text. Fit the complete number together with its sign, unit, and meaningful precision; never crop digits or silently change the value to make it fit.
- Keep readable minimum font sizes and respect browser zoom/text scaling. When content cannot fit at those minimums, wrap or reflow it, or provide a local scroll/detail view rather than shrinking it indefinitely.
- Resize charts, axes, legends, tables, and tooltips with their containing component. Recalculate layout after a hidden/collapsed component becomes visible.
- Preserve user-chosen component sizes across rerenders and applicable view navigation. Provide a labelled reset-layout/size action separate from Reset Filters; resizing and resetting sizes must preserve cross-filters, sorting, selection, and source trace.
- Document size limits, typography fitting rules, and reset behavior in the project design system when implementing this capability.

## Expand and collapse contract

Every dashboard component must support expanded and collapsed states unless collapsing it would destroy the meaning of a tightly coupled control. In that exceptional case, group the coupled controls inside a collapsible parent.

- Keep the component title and expand/collapse control visible in both states. Preserve a short status, KPI, or active-filter summary when it materially helps orientation.
- Use a semantic `<button>` with `aria-expanded` and `aria-controls`, or native `<details>/<summary>` when its behavior and styling fit.
- Keep keyboard operation, visible `:focus-visible`, and a touch target of at least 44×44 px.
- Preserve component state, filters, sorting, selection, and scroll position across collapse/expand unless the user explicitly resets them.
- Animate only `transform` and `opacity`, keep transitions functional and brief, and make the final content immediately available under `prefers-reduced-motion`.
- Avoid layout jumps: collapsing removes detail while leaving a stable header row; expanding must not cover unrelated controls or push essential navigation off-screen.

## Dashboard components

### Shell, navigation, and filters

- Keep navigation placement consistent across pages and visibly mark the current location.
- Maintain the project/week/filter/reset/last-updated context established by the architecture.
- Active filter chips must be visible, independently removable, composable with other filters, and cleared together only by Reset Filters.
- Browser back/forward and internal navigation should preserve relevant filters, scroll position, and expanded/collapsed state where practical.
- Use one shared navigation state with three deliberate presentations: expanded desktop sidebar, compact icon rail, and off-canvas mobile sheet. Do not maintain separate conflicting navigation trees for each breakpoint.
- When the sidebar becomes icon-only, retain accessible names and show a tooltip on hover and keyboard focus. Keep the current-page state perceivable without relying on tooltip text.
- A mobile navigation sheet must have an accessible title/description, trap focus while open, close predictably, and return focus to its trigger.
- Persist the user's sidebar preference only when persistence improves repeat use. A stored preference must not force an unusable state after the viewport changes.
- Keep the main content as a semantic `<main>` inset beside the navigation. Its minimum width must be zero so internal grids and tables shrink instead of forcing page overflow.

### KPI cards and management attention

- KPI labels, values, scope, reporting period, evidence state, and limitations must be unambiguous.
- A clickable KPI opens the filtered record list or source trace that supports it.
- Use tabular numerals for KPI values, counts, durations, weeks, and aligned numeric columns.
- Rank management-attention items by evidence-backed impact and show owner plus next action. Do not equate workload with individual performance.
- Use compact number formatting only when it improves scanning, and expose the exact value in accessible detail. Never hide material precision or round away discrepancies.

### Tables

- Use semantic table markup. Left-align text; right-align numeric values; provide units and locale-aware date/number formatting.
- Every column must have a clear header, including an accessible label for action or selection columns.
- Clicking a sortable column header for the first time sorts descending; clicking it a second time sorts ascending. Subsequent clicks alternate descending and ascending. A newly selected sort column starts descending. Show the current direction and expose it through `aria-sort`.
- Sort according to the underlying data type (numbers, dates, text), not formatted display strings. Keep empty-value placement deterministic and preserve active filters during sorting.
- Every data-column header must provide a column filter suited to its data type, such as text search, category selection, or a numeric/date range. Action and selection headers may explicitly be non-filterable.
- Keep the sort trigger and filter trigger separately labelled and operable. Opening or editing a header filter must not accidentally toggle sorting.
- Header filters participate in the shared, bidirectional cross-filter state wherever the dimension has a valid relationship. Show their selections as removable chips, combine them with other filters, and clear them with Reset Filters.
- Freeze the header row using sticky positioning within the table's scroll container. Keep it visible during vertical scrolling, with an opaque background and appropriate stacking so body rows never obscure header labels or controls.
- Use pagination or virtualization when row volume makes full rendering costly; retain frozen headers, column filtering, and sorting across page changes.
- Row hover and selected states change background rather than adding decorative borders.
- Provide loading, empty, error, stale, and loaded states. Error states explain recovery; empty states distinguish a valid zero from missing evidence; stale states show the actual `as of` time without pretending the data is current.
- Make row actions keyboard accessible. Confirm destructive actions and offer undo when feasible.

### Charts and analytical views

- Choose chart type by question: trend → line/area; comparison/ranking → bar; composition → stacked bar; schedule concentration → timeline/heatmap; dependency trace → matrix/table.
- Avoid pie/donut charts when precise comparison or more than five slices is required.
- Label units, time granularity, current reporting week, and source limitations. Provide exact values through accessible labels or keyboard-reachable tooltips.
- Provide a textual insight or data-table alternative. Data marks require at least 3:1 contrast against the background; text requires WCAG AA.
- Design loading, empty, error, stale, and loaded states for every chart. Never render a blank frame as a state.

### Drawers, dialogs, and feedback

- Detail drawers preserve the source breadcrumb and record trace. On small screens they may become a full-width sheet while retaining a visible close control.
- Dialogs trap focus and restore it to the trigger on close. Do not use a modal as page navigation.
- Async actions acknowledge immediately and resolve with explicit success or recoverable error feedback.

## Component architecture and reuse

All code written for this project must be modular and reusable. Places with the same function must call one shared implementation and supply parameters for their differences.

- Before adding a function or component, look for an existing implementation with the same responsibility and reuse or extend its public interface.
- Extract repeated rendering, calculations, filtering, formatting, resizing, text fitting, and event handling into focused modules. Do not copy a function for another page merely to change field names, labels, thresholds, or styles.
- Pass differences through named parameters or a configuration object: data, field selectors, labels, units, columns, dimensions, visual variants, limits, and callbacks. Provide sensible defaults and make required inputs clear.
- Keep each module responsible for one coherent function. Expose explicit inputs and outputs; avoid hidden dependencies on page-specific DOM IDs, global variables, or mutable singleton state.
- Separate pure calculations from DOM rendering and side effects. Inject state access and callbacks where needed so multiple component instances can reuse the same module independently.
- Extend a shared implementation for a new supported case through parameters, small adapters, or composition. Avoid a large universal function with unrelated modes or many boolean flags.
- Verify a changed shared module with representative parameter sets from its actual callers. A fix to shared behavior must reach every applicable caller without duplicated patches.

Use a layered component model adapted from shadcn-style composition without importing its framework:

1. **Primitives** own semantics, accessibility, visual variants, and interaction states: button, badge, card/panel, tooltip, popover, sheet/drawer, dialog, tabs, table shell, skeleton, alert, and scroll region.
2. **Dashboard components** compose primitives around one analytical purpose: KPI, health strip, attention item, chart panel, filter bar, data table, source trace, and collapsible section.
3. **Page renderers** arrange dashboard components and connect them to filter/domain state; they do not duplicate primitive markup or styling.

- Extend behavior through composition and documented variants rather than editing every instance or creating one-off classes.
- Keep shared primitives free of workbook-specific business rules. Domain logic belongs in centralized selectors, formatters, and feature modules.
- Give each reusable component one stable public contract: content/data inputs, state, events, accessibility label, and optional visual variant.
- Use data/state attributes or equivalent class contracts for `expanded`, `collapsed`, `active`, `selected`, `loading`, `empty`, `error`, `stale`, and `disabled` states. Avoid selectors coupled to incidental DOM nesting.
- An interactive card or KPI must contain a real `<button>` or `<a>` covering the intended target. Never copy a clickable `div` pattern.
- Icon-only actions require an accessible name and tooltip; destructive actions also require explicit confirmation or an undo path.
- Prefer one centralized variant function or class map for repeated statuses, sizes, densities, and tones. Do not concatenate arbitrary classes or duplicate semantic-color decisions across renderers.

## Grid and panel composition

- Use a responsive 12-column mental model on wide screens only as a composition aid, implemented with fluid CSS Grid. Do not encode fixed pixel positions or require users to drag widgets into place.
- Full-width rows are appropriate for filter bars, primary timelines, dependency matrices, and detailed tables. Pair analytical panels using meaningful proportions such as 7/5, 8/4, or 6/6 based on information priority.
- At narrower widths, reduce column count and then stack. Preserve reading order in the DOM so the responsive visual order remains logical for keyboard and screen-reader users.
- Shared panel headers should provide a consistent title slot, optional context/subtitle, action slot, freshness/source affordance, and expand/collapse control.
- Let panel content determine its minimum useful height. Avoid equal-height styling when it creates empty space or clips tables and charts.
- Use internal scroll regions only where the component genuinely needs bounded content. A panel's scroll area must remain keyboard reachable and visibly associated with its header.

## Data provenance and reproducibility

Every data-backed visual must let a reviewer answer: **What is this data, where did it come from, when was it produced, which rules shaped it, and how can it be rebuilt?**

- Associate each KPI, chart, table, heatmap, matrix, and attention item with its authoritative workbook or derived dataset and the relevant filter/rule scope.
- For each derived dataset, retain a human label, description, source workbook/sheet, applied filters, build script or transformation, refresh cadence, and `as of` timestamp where available.
- Treat the build command and source file paths as part of provenance. A future maintainer must be able to reproduce the dashboard from the three authoritative workbooks without reverse-engineering the browser code.
- Surface provenance through the existing detail drawer, source trace, evidence note, or an equivalent accessible disclosure. Do not crowd every widget with the full lineage when a linked source view can show it.
- When freshness is unknown, say `Unknown` or `Not provided`; never infer a timestamp from the current browser session.
- Keep sample, fallback, and test data visibly marked and structurally separate from authoritative or regenerated production data.

## First-paint and refresh behavior

- Render the dashboard shell, headings, labels, units, empty-state copy, and stable layout before expensive JavaScript or chart work completes. Do not show a blank application while data initializes.
- Match skeleton geometry to the final component to avoid large layout shifts. Prefer section-level hydration so one slow widget does not block the rest of the page.
- Run independent data preparation in parallel where safe; avoid sequential waits that delay unrelated sections.
- Debounce free-text and high-frequency filters at an appropriate interval, normally around 300 ms, while selects and explicit actions respond immediately.
- Reuse unchanged derived data and calculations rather than recomputing or refetching them on every interaction. Preserve visible stale data during a refresh when it is safe, label it, and replace it atomically when the refreshed result is ready.

## Accessibility and interaction floor

- Use semantic landmarks, one logical `h1`, sequential headings, a skip link, and native interactive elements.
- All functionality must work by keyboard; tab order follows visual order.
- Use `:focus-visible`, never remove focus indication, and ensure the ring has at least 3:1 contrast.
- Body/supporting text must reach 4.5:1 contrast; large text and graphical/UI elements need at least 3:1. Compute ratios rather than claiming compliance by eye.
- Support 200% zoom, text expansion, logical CSS properties, Windows forced colors, and `prefers-reduced-motion`.
- Interactive controls include default, hover, focus-visible, active, and disabled states. State is never communicated by color alone.

## Implementation workflow

1. State a one-line design read and list the specific behavior being changed.
2. Audit the current UI first. Preserve what works and choose the smallest coherent improvement.
3. Update shared tokens and reusable primitives before introducing page-specific styling or behavior.
4. Keep presentation primitives separate from data/domain rules. Centralize repeated layout, filtering, collapse, status, formatting, and variant logic.
5. Prefer native HTML/CSS and installed dependencies. Check `package.json` before adding a library; do not add one for behavior native elements can handle well.
6. Define the question answered by every proposed widget and remove any widget that provides data without a decision purpose.
7. Update `docs/design-system.md` whenever the implemented visual system, component contract, or responsive behavior changes.
8. Perform an adversarial review: identify the weakest part, check for generic admin-template drift, verify source traceability and first-paint behavior, and fix real findings before delivery.

## Verification and delivery

For implementation work, verify in proportion to the change:

- Run `npm run lint`, `npm test`, and `npm run build` when the changed scope can affect them.
- Render the dashboard and inspect at 375, 768, and 1280+ px widths plus roughly 700 and 800 px heights. Check page overflow, clipped content, sticky regions, drawers, tables, filters, and every component's collapsed and expanded states.
- Exercise keyboard navigation, visible focus, filter composition/reset, data-state variants, and drill-down/source-trace behavior.
- For tables, verify all column headers, first-click descending/second-click ascending sorting, data-type-aware ordering, header filters, Reset Filters, and frozen-header readability during vertical and horizontal scrolling. Verify sort and filter controls independently by keyboard.
- Resize components to their minimum, intermediate, and maximum permitted sizes using pointer, touch, and keyboard controls. Verify that long titles, large/negative/decimal KPI values, units, charts, and tables fit correctly while preserving readable typography at 200% zoom.
- Verify size persistence, reset-layout behavior, resize after expand/collapse, and preservation of all active cross-filters during resizing.
- Verify expanded sidebar, icon rail, and mobile navigation sheet behavior, including accessible names, tooltip-on-focus, focus return, and preference handling across viewport changes.
- Verify reusable primitives and panel headers stay visually and behaviorally consistent across at least two different dashboard pages or contexts when they are changed.
- Confirm that the first viewport communicates the core story, contains the primary KPI/attention signals, and does not exceed the agreed density without a clear reason.
- Confirm that each derived visual exposes its source, applied scope, and freshness, and that the documented build path can reproduce it from authoritative files.
- Compute contrast for any new or changed token pair.
- Do not report Core Web Vitals or accessibility as measured unless they were actually measured.
- After dashboard work, start the local dashboard, leave it running for inspection, and report the local URL.
- Do not push, publish, deploy, or update the remote repository without explicit user instruction.

## Completion gate

The work is not complete if any of these remain:

- Page-level horizontal overflow or content clipped at a tested viewport.
- A dashboard component without a usable expanded and collapsed state.
- A dashboard component without user-adjustable sizing or an accessible alternative to drag resizing.
- Text, numbers, units, charts, or controls that fail to adapt to the component size, or fitting that crops digits, changes values, or shrinks text below readable limits.
- Resizing that overlaps adjacent components, clears cross-filters, or resets the user's chosen sizes unexpectedly.
- Collapse/expand controls without semantics, keyboard access, or visible focus.
- Icon-only navigation or actions without accessible names and keyboard-reachable explanatory tooltips.
- A clickable non-semantic `div`, duplicated primitive markup, or page-specific variant logic that should live in a shared component.
- Multiple copies of the same function or component that differ only by configuration, or a reusable module coupled to one page through hidden dependencies.
- Mobile navigation that does not trap/restore focus, or a saved sidebar state that makes another viewport unusable.
- Filters that silently replace unrelated active filters or Reset Filters that leaves hidden state behind.
- A data table with missing column headers, missing data-column filters, incorrect descending-first sort behavior, or a header row that does not stay visible while scrolling.
- A KPI, chart, or attention count that cannot open supporting records or explain its evidence boundary.
- A data view missing loading, empty, error, stale, or loaded handling.
- Color-only status, low-contrast text, unlabeled units, inaccessible tooltip content, or blank chart states.
- A headline value without decision context, or a widget that cannot state the question it answers.
- A derived visual whose source, filters/rules, freshness, or reproduction path cannot be identified.
- A blank first paint or a slow widget that unnecessarily blocks independent dashboard sections.
- New styling that conflicts with `docs/design-system.md` or hardcodes repeated visual values outside the token layer.
- Unverified claims about rendered behavior, accessibility, performance, or source data.
