# Design

The workbook is a technical standard you fill in. It uses a strict grid and hairline rules rather than boxes. Clause references hang in a margin column beside the content they anchor. Lavender marks only where you are and what's selected.

## Tokens (css/styles.css `:root`)

| Role | Light | Dark |
|---|---|---|
| Paper (page ground) | `#FFFFF9` | `#313638` |
| Paper sunk (sidebar, table heads, ref column) | `#F4F3EA` | `#2A2E30` |
| Ink | `#313638` | `#F1F0E8` |
| Ink 2 (secondary text) | `#565B5E` | `#C4C6C1` |
| Ink 3 (meta, placeholders) | `#6B7073` | `#A3A6A2` |
| Rule / rule strong | `#DEDCD1` / `#BDBAAE` | `#464B4E` / `#5E6467` |
| Lavender (accent, focus) | `#6A57BC` | `#C7BCF6` |
| Lavender ink (accent text) | `#57449F` | `#D9D1FA` |
| Lavender tint (current item, selection, examples) | `#EEEAF9` | `#3F3D55` |
| OK / warn / high / bad | `#2F7350` `#93600F` `#A4511C` `#AA3434` | `#8FCCA8` `#E5BC72` `#EFA77A` `#F09A95` |

Pure `#FFFFFF` and `#000000` are never used, including in shadows and print.

Theme resolves in this order: `?theme=` query, saved choice (`iso42001:theme`), then `prefers-color-scheme`.

## Type

Public Sans (400 to 700) with tabular numerals everywhere.

| Use | Size | Weight |
|---|---|---|
| Sheet title | clamp(26px, 2.6vw, 34px) | 700 |
| Section heading | 19px | 650 |
| Body | 15px / 1.55 | 400 |
| Labels, table heads, refs | 12.5–13px | 600 |

Tracking is -0.015 to -0.022em on headings only.

## Layout

- Sidebar 288px, sticky. The theme switch is docked at the bottom left at every width.
- The sheet grid is a 104px margin column (72px under 1180px), a 24px gap, then the body. Under 720px the margin stacks above the content.
- Sections are separated by 1px rules. The sheet head closes with a full-ink rule.
- Corners are 4px. Elevation appears only on the toast and the mobile drawer.

## Components

- **Status marks:** a 12px glyph in a fixed cell beside every status select. Filled means done, half means partial or in progress, half amber means at risk or pending, hollow means open, struck means fail, a dash means N/A, and dashed means empty.
- **Risk level chips:** tinted backgrounds for Low, Medium, High and Critical. The risk matrix uses the same tints.
- **Registers:** fixed-row tables. The reference column is sticky and sunk, group rows use lavender ink, and read-only cells sit on paper.
- **Example disclosure:** a lavender summary line that opens onto a tinted panel.
- **Tally line:** live counts per status under a register.

## Motion

The sheet settles in once with an 8px translate, using an exponential ease-out. Content is never hidden by the animation. All motion is removed under `prefers-reduced-motion`.
