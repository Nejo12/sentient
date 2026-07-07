# Android floating bubble — Design spec

**Status:** Approved 2026-07-08
**Repo:** https://github.com/Nejo12/sentient
**Depends on:** `docs/superpowers/specs/2026-07-04-sentient-design.md` (product spec), `plugins/with-android-bubble/README.md` (original native-module outline)

---

## 1. One-liner

The Android entry point for Sentient: a persistent floating "chat head" bubble that rides on top of any app. Tapping it reads the clipboard and opens Sentient straight to the existing Choose screen — the Android equivalent of the iOS Share Extension, reusing the same in-app flow rather than building a second one.

## 2. Why this scope (locked decisions)

This first version is deliberately narrower than the original native-module outline in `plugins/with-android-bubble/README.md`, which additionally described an in-place expanded panel with its own quick-action tiles and an option for Accessibility-Service-based text capture. Those are real, larger pieces of native UI/permission work; this spec defers them until the simpler slice is proven.

| Decision | Value | Why |
|---|---|---|
| Tester has Android device/emulator? | Neither set up yet | Environment setup (Android Studio, SDK, device/emulator) is part of the implementation plan's first phase, not assumed. |
| Bubble tap behavior | Opens full Choose screen (no in-place expanded panel) | Reuses the Choose screen and its existing deep-link handling entirely; no second native UI surface to design/build/test. |
| Text capture | Clipboard only | No Accessibility Service, no second heavily-scrutinized permission. Matches the WhatsApp-on-iOS fallback (copy, then open Sentient) already shipped. |
| Start/stop | Auto-starts once overlay permission is granted in Setup | One fewer settings surface; permission grant is already the meaningful gate. |
| Movement | Draggable with snap-to-edge | User's explicit choice — real native touch-handling work, not deferred. |
| Persistence across app-kill/reboot | Not required | No `BOOT_COMPLETED` receiver, no `START_STICKY` restart handling. Bubble restarts next time the user opens Sentient (permission is already granted, so `startBubble()` fires again from `app/setup.tsx`'s existing effect or an app-launch check). |
| App icon | Regenerated to match brand | Current `assets/images/icon*.png` files are the unmodified default Expo template icon (blue chevron, construction guides) — unrelated to the Sentient brand. Fixed as part of this work since it touches Android adaptive-icon assets anyway. |

## 3. Out of scope (this spec, deferred to v1.1+)

- In-place expanded panel (quick-action tiles rendered natively without opening the app)
- Accessibility-Service-based text capture
- Surviving process death / device reboot without reopening the app
- Any change to the iOS flow

## 4. Architecture

```
app.json (plugins: ["./plugins/with-android-bubble"])
        │
        ▼
plugins/with-android-bubble/index.js   (Expo config plugin, runs at prebuild)
        │  - adds SYSTEM_ALERT_WINDOW (already present) + foreground service
        │    declaration to AndroidManifest.xml
        │  - registers SentientOverlayPackage in MainApplication
        │  - copies Kotlin sources into android/app/src/main/java/.../overlay/
        ▼
SentientOverlayModule.kt   (native module, JS bridge)
        │  canDrawOverlays() / startBubble() / stopBubble() / isBubbleRunning()
        ▼
BubbleOverlayService.kt   (foreground Service)
        │  - startForeground() with a low-priority "Sentient bubble" notification
        │  - WindowManager overlay view: 56px oxblood circle + white brand glyph
        │  - drag handling + snap-to-edge on release
        │  - on tap: read ClipboardManager text, build deep link, fire Intent
        ▼
sentient://choose?message=<clipboard text>&sourceApp=Android
        │
        ▼
app/(flow)/choose.tsx   (existing route-param / deep-link handling — unchanged)
```

## 5. Components

| File | Purpose |
|---|---|
| `plugins/with-android-bubble/index.js` | Config plugin: manifest permission + foreground service declaration, package registration, copies Kotlin sources at prebuild. Mirrors the pattern already established by `plugins/with-ios-share-text-fix/index.js` (a `withXcodeProject`-equivalent Android mod, ordered correctly relative to other plugins). |
| `android` Kotlin sources (copied by the plugin) | `SentientOverlayModule.kt`, `SentientOverlayPackage.kt`, `BubbleOverlayService.kt` — native module + package registration + foreground service with the overlay view, drag/snap physics, clipboard read, and deep-link `Intent` firing. |
| `src/services/bubbleService.ts` (new) | Thin JS wrapper over the native module: `startBubble()`, `stopBubble()`, `isBubbleRunning()`. Parallel to the existing `src/services/overlayPermission.ts`, which already wraps `canDrawOverlays()`. |
| `app/setup.tsx` (modified) | After `requestOverlayPermission()` succeeds and `isOverlayPermissionGranted()` confirms it, call `bubbleService.startBubble()`. |
| App icon script (new, one-off) | Composes an SVG matching `src/components/BrandMark.tsx`'s exact structure (oxblood rounded-square background, white Lucide message-circle glyph, small white filled heart badge bottom-right) and rasterizes it to replace `assets/images/icon.png`, `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, `splash-icon.png`. |

## 6. Data flow

1. User copies a message's text in any app (WhatsApp, Messenger, etc. — normal OS copy, no Sentient involvement).
2. User taps the floating bubble.
3. `BubbleOverlayService` reads the clipboard via Android's `ClipboardManager` (native side, no JS involved yet).
4. Service builds `sentient://choose?message=<url-encoded clipboard text>&sourceApp=Android` and fires an `Intent` to launch/resume the Sentient app at that URL.
5. This lands exactly on the same deep-link path the iOS Share Extension already uses — `app/(flow)/choose.tsx`'s existing `parseShareIntent`/route-param handling, with no new parsing logic required.

## 7. Error handling

- **Empty/non-text clipboard:** deep link omits `message`; Choose falls back to its existing empty state. No special-case native code.
- **Overlay permission revoked while service is running:** the app already re-checks `isOverlayPermissionGranted()` in `app/setup.tsx` on every `AppState` transition to `active` (existing code). This spec extends that same check: if permission is no longer granted, call `bubbleService.stopBubble()` there, rather than adding a separate polling mechanism inside the service itself.
- **`startBubble()` called without permission:** rejects with a distinct error code (e.g. `OVERLAY_DENIED`) rather than failing silently, matching the pattern already used by other native calls in this codebase.

## 8. Testing

There is no existing Kotlin test harness in this repo (the iOS native fix was verified the same way this will be: a Jest test over the plugin's own file-patching logic, plus manual on-device verification — see `__tests__/with-ios-share-text-fix.test.js`). This spec follows the same pattern:

- Jest test for `plugins/with-android-bubble/index.js`'s manifest-patching logic (pure Node/string logic, testable without a device).
- Jest test for `src/services/bubbleService.ts`, mocking the native module (parallel to how `overlayPermission.ts` would be tested).
- The native Kotlin module/service itself is verified manually on a real device or emulator once the Android build environment is set up, the same way the iOS Share Extension was verified end-to-end on a physical device.

## 9. Build phases

| Phase | Scope |
|---|---|
| 0 | Set up Android build environment (Android Studio, SDK, emulator or physical device) — not yet installed. |
| 1 | Regenerate app icon + Android adaptive-icon assets from `BrandMark`'s composition. |
| 2 | Config plugin: manifest permission (already present) + foreground service declaration + package registration. |
| 3 | `SentientOverlayModule.kt` + `SentientOverlayPackage.kt` (native bridge, no UI yet) + `src/services/bubbleService.ts`. |
| 4 | `BubbleOverlayService.kt`: overlay view, foreground notification, start/stop lifecycle. |
| 5 | Drag + snap-to-edge handling. |
| 6 | Clipboard read + deep-link `Intent` firing on tap. |
| 7 | Wire `app/setup.tsx` to auto-start the bubble once permission is granted. |
| 8 | On-device verification: permission grant → bubble appears → drag/snap → tap → clipboard text lands in Choose. |

## 10. Privacy note

Consistent with the existing privacy stance (`docs/superpowers/specs/2026-07-04-sentient-design.md` §13): the bubble only reads the clipboard when the user taps it, never in the background, and nothing is sent anywhere until the user explicitly acts in the Choose/Compare/Send-back flow exactly as today.
