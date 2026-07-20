# Sentient visual identity

## Brand idea

Sentient helps people pause between receiving a message and reacting to it. The visual identity represents two voices, a deliberate gap, and the possibility of mutual understanding.

## Mark

The mark uses two mirrored conversation strokes separated by a central point:

- the upper stroke represents the message received
- the lower stroke represents the reply being considered
- the central point represents the pause where interpretation happens
- the rounded oxblood tile keeps the mark calm, human and recognisable at small sizes

The mark must not be described as an AI brain, robot, sparkle or automation symbol.

## Core palette

| Token | Value | Purpose |
|---|---|---|
| Oxblood | `#7F3523` | Primary brand field and decisive actions |
| Deep oxblood | `#632818` | Depth, pressed states and shadows |
| Warm paper | `#F5EFE6` | Primary background |
| Ink | `#2B2521` | Main text |
| Olive | `#7C7838` | Healthy states and constructive guidance |
| Soft clay | `#F1E3D6` | Selected and supporting surfaces |

## Typography

- **DM Serif Display** for reflective headlines and brand moments
- **DM Sans** for controls, explanations and operational content

## Product principles

1. Calm rather than futuristic.
2. Human rather than technological.
3. Clear rather than decorative.
4. Warm but not sentimental.
5. Distinctive at 24 px as well as full-screen.

## Asset strategy

`assets/brand/sentient-mark.svg` is the vector source of truth. The in-app `BrandMark` component implements the same geometry with `react-native-svg`.

Before the next App Store submission, export the approved mark as:

- `assets/images/icon.png` — 1024 × 1024, opaque
- `assets/images/splash-icon.png` — transparent mark with safe padding
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-background.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/favicon.png`

Do not replace production icon binaries until the mark has been reviewed on a physical device at home-screen size.