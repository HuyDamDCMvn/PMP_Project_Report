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

Typography uses Inter/system sans-serif with 30 px page titles, 20 px section headings, 30–34 px KPI values, 14 px body text and 12 px metadata. Spacing follows an 8 px base with 4 px for compact internal gaps. Panel radius is 10 px; shadows are limited to `0 2px 8px rgba(16,24,40,.06)`.

Charts use semantic colour only. Labels, values and patterns remain visible without colour. Historical weeks are grey, the reporting week is blue with a dashed boundary and future weeks are neutral.

## Reusable components

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
