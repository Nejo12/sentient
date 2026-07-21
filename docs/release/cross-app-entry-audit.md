# Cross-app entry and accessibility acceptance

Sentient must never depend on one application exposing a specific Share action. The supported entry model is deliberately layered.

## Supported entry paths

### iOS

1. **Share Sheet** — select text or a supported URL, tap Share, then choose Sentient.
2. **Copy and paste fallback** — copy the message, open Sentient, and paste it into the message field.

WhatsApp controls its own contextual actions. Sentient cannot force WhatsApp to expose Share for every message type or selection state. Product copy and reviewer notes must therefore present copy and paste as the universal fallback.

### Android

1. **Android Share Sheet** — share selected text to Sentient where the source app supports it.
2. **Optional floating bubble** — copy a message, tap the Sentient bubble, and let the foreground Choose screen read the clipboard.
3. **Copy and paste fallback** — open Sentient and paste manually.

The floating bubble is not a keyboard and does not use an Accessibility Service. It uses `SYSTEM_ALERT_WINDOW` only after the user explicitly enables it.

## Privacy boundary

- Do not read the clipboard continuously.
- Do not read chat content through an Accessibility Service.
- Do not log clipboard contents, shared text, generated replies, names, or conversation content.
- Do not imply that Sentient monitors chats in the background.
- Do not send a reply automatically.

## iOS physical-device matrix

Test both cold launch and warm launch.

| Source | Selected text | URL | Emoji/Unicode | Multiline | Cancel safely | Source label |
|---|---:|---:|---:|---:|---:|---:|
| WhatsApp | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| Messages | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| Messenger | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| Mail | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Notes | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Safari | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

Acceptance:

- Shared text arrives intact.
- Very long text is not silently truncated.
- Cancelling does not navigate into Sentient.
- Unknown source applications use generic copy-and-return guidance.
- WhatsApp direct switching is shown only when the tested URL scheme is available.

## Android bubble matrix

Test on a Pixel/Android reference device and at least one Samsung device.

- [ ] Permission request appears only after explicit user action.
- [ ] The feature can be skipped without blocking setup.
- [ ] Bubble appears after permission is granted.
- [ ] Bubble can be dragged and activated with TalkBack enabled.
- [ ] Bubble has a meaningful accessible label and action.
- [ ] Copy in WhatsApp, Chrome, Messages, and Notes; tap bubble; copied text appears in Choose.
- [ ] No clipboard read occurs before activation.
- [ ] Revoking overlay permission stops the bubble.
- [ ] Force quit stops the bubble; reopening restores it only when permission remains granted.
- [ ] Large display size and font size do not obscure setup controls.
- [ ] Colour correction, high contrast, and dark system appearance keep the bubble visible.

## Production-build acceptance

Do not use Expo development-client screenshots for store submission.

- [ ] Install the EAS production-profile build.
- [ ] Confirm no developer menu, DevTools, sample parameters, or diagnostic entry point is visible.
- [ ] Confirm launcher, splash, Share Sheet, Android adaptive, monochrome, and bubble marks use the same approved geometry.
- [ ] Confirm iOS icon is opaque and has no pre-rounded outer corners.
- [ ] Inspect Android circle, squircle, rounded-square, and themed-icon masks.
- [ ] Capture store screenshots only from the accepted production build.
