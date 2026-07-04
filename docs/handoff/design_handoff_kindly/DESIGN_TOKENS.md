# Design Tokens — Kindly (Mail a Moment design system)

Colors are authored in **oklch** (the authoritative source). Hex values are close approximations for convenience — prefer oklch where your stack supports it. Full source: `design/design-system-tokens.css`.

## Colors

| Token | oklch (authoritative) | ~hex | Use |
|---|---|---|---|
| Paper (background) | `oklch(0.955 0.018 75)` | `#F5EFE6` | App/screen background |
| Paper strong | `oklch(1 0 0)` | `#FFFFFF` | Card faces |
| Paper soft | `oklch(0.96 0.015 75)` | `#F6F1E9` | Secondary surface |
| Paper muted | `oklch(0.94 0.01 75)` | `#EFEAE1` | Subtle wash, chips |
| Ink (foreground) | `oklch(0.2 0.02 30)` | `#2B2521` | Primary text |
| Ink 72% | `oklch(0.2 0.02 30 / 72%)` | `#2B2521` @72% | Body text |
| Ink 55% | `oklch(0.45 0.02 30)` | `#6E655E` | Secondary text |
| Ink 40% | `oklch(0.55 0.015 30)` | `#8A817A` | Captions, tertiary |
| Ink 20% | `oklch(0.2 0.02 30 / 20%)` | — | Placeholder, grabber |
| **Oxblood (primary)** | `oklch(0.38 0.13 20)` | `#7F3523` | All primary actions, brand, links, focus |
| Oxblood strong | `oklch(0.3 0.12 20)` | `#632818` | Primary hover/press |
| Oxblood fg | `oklch(1 0 0)` | `#FFFFFF` | Text on oxblood |
| Clay (accent) | `oklch(0.5 0.09 35)` | `#9C5A44` | Eyebrow labels, pill text |
| Soft (accent-soft) | `oklch(0.92 0.04 75)` | `#F1E3D6` | Tinted tiles, selection, pills |
| Olive (success) | `oklch(0.52 0.11 75)` | `#7C7838` | Success only (toast, checks) |
| Olive soft | `oklch(0.52 0.11 75 / 12%)` | — | Success toast bg |
| Border | `oklch(0.9 0.015 75)` | `#E7DFD3` | Default 1px border |
| Border strong | `oklch(0.84 0.015 75)` | `#D5CBBB` | Inputs, dividers |
| Destructive | `oklch(0.55 0.22 25)` | `#C4402E` | Rare; avoid alarming red |

## Typography
- **Sans:** `DM Sans` — 400 / 500 / 600 / 700. All UI and copy.
- **Serif:** `DM Serif Display` — 400 only. Wordmark + the large reply preview on Send-back. **Not** used in app chrome.
- **Mono:** SF Mono stack. Rare (metadata only).

| Role | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Display / hero (marketing) | 44px | 600 | -0.05em | 0.98 |
| Screen title | 22px | 600 | -0.03em | 1.1 |
| Section heading | 30px | 600 | -0.03em | 1.1 |
| Card / row title | 14–16px | 600 | -0.02em | 1.3–1.4 |
| Body | 13.5–15px | 400 | 0 | 1.6–1.75 |
| Small / subtitle | 11.5–12.5px | 400–500 | 0 | 1.5 |
| Eyebrow (clay) | 11–12px | 600 | 0.02em | 1 |
| Button label | 12–15px | 600 | 0.12em | 1 |
| Pill label | 11px | 500 | 0 | 1 |
| Wordmark (serif) | 17–28px | 400 | -0.02em | 1 |

## Spacing (8pt grid)
`4, 8, 12, 16, 20, 24, 32, 40, 56, 72` px. Screen padding 18–24px; card padding 12–20px; gaps 8–16px.

## Radius
| Token | px | Use |
|---|---|---|
| sm | 8 | small inner elements |
| md | 12 | inputs, list cards, quote cards |
| lg | 16 | panels, result cards |
| xl | 22 | featured panels, bubble panel |
| 2xl | 30 | product stage (reply preview) |
| pill | 9999 | all buttons, avatars, toggles |
| device screen | 44 | (prototype frame only) |

## Shadows
| Token | Value | Use |
|---|---|---|
| sm | `0 2px 8px oklch(0.3 0.02 30 / 6%)` | list cards, chips |
| md | `0 12px 36px oklch(0.3 0.02 30 / 10%)` | panels |
| lg | `0 22px 70px oklch(0.3 0.02 30 / 14%)` | hero surfaces |
| product | `0 20px 56px rgb(47 33 29 / 0.12), inset 0 1px 0 rgb(255 255 255 / 0.75)` | reply preview stage |
| oxblood glow | `0 10px 26px oklch(0.3 0.12 20 / 45%)` | floating bubble, brand tile |

## Motion
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out).
- Durations: 160 / 200 / 320 / 360 / 460ms (bigger element → slower).
- Entrance `fade-rise`: opacity 0→1, translateY 10px→0, 360ms.
- Button hover: `translateY(-1px)`, 200ms. Card hover: lift + warm border, 320ms.
- `@media (prefers-reduced-motion: reduce)` disables all motion.

## Component quick-reference
- **Primary button:** oxblood bg, white text, pill, min-height 48 (lg 52–54), tracking 0.12em; hover → oxblood-strong + lift.
- **Secondary button:** muted surface, 1px border-strong, ink text.
- **Text button:** oxblood text, underline on hover (4px offset).
- **Pill (label):** 11px, radius 6; accent = soft bg + clay text + dot; success = olive; neutral = bordered, no dot.
- **Toggle (on):** 46×28 oxblood track, 22px white knob right. Off: border-strong track, knob left.
- **Input:** translucent white, 1px border-strong, radius 12, min-height 52; focus → oxblood/55% border + 4px oxblood/14% glow.
