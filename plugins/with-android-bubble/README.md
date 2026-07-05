# with-android-bubble (native module outline)

Use this plugin when implementing the Android floating bubble overlay for Sentient.

## Goal

Provide a persistent chat-head bubble over any app, matching `screens/06-android-bubble.png`:

- 56px oxblood circle with white brand glyph
- Expanded panel with two intent quick actions + "Open full options in Sentient"
- Deep link handoff: `sentient://choose?message=<encoded>&sourceApp=<encoded>`

## Required native pieces

### 1. Config plugin (`plugins/with-android-bubble/index.js`)

During prebuild:

1. Add `SYSTEM_ALERT_WINDOW` to `AndroidManifest.xml`.
2. Register `SentientOverlayPackage` in `MainApplication`.
3. Add foreground service declaration with `foregroundServiceType` as required by target SDK.
4. Copy Kotlin sources into `android/app/src/main/java/.../overlay/`.

### 2. React Native bridge (`SentientOverlayModule.kt`)

Expose to JS:

| Method | Returns | Notes |
| --- | --- | --- |
| `canDrawOverlays()` | `Promise<boolean>` | Wraps `Settings.canDrawOverlays(context)` |
| `startBubble()` | `Promise<void>` | Starts foreground service + overlay window |
| `stopBubble()` | `Promise<void>` | Tears down service and window |
| `isBubbleRunning()` | `Promise<boolean>` | Service alive check |

JS consumer: `src/services/overlayPermission.ts` (check) and a future `bubbleService.ts` (start/stop).

### 3. Foreground service (`BubbleOverlayService.kt`)

1. Call `startForeground()` with a low-priority notification channel ("Sentient bubble").
2. Create overlay via `WindowManager.addView()` with:
   - `type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` (API 26+)
   - `flags = FLAG_NOT_FOCUSABLE | FLAG_LAYOUT_NO_LIMITS` (adjust for expanded panel)
3. Handle drag + snap-to-edge for the bubble.
4. On bubble tap, inflate expanded panel (Compose or XML).
5. On destroy, remove overlay view and stop foreground.

### 4. Expanded panel actions

- Tile 1 → deep link with clipboard/selection text, intent `do`
- Tile 2 → deep link with clipboard/selection text, intent `missing`
- Primary button → `sentient://choose?...` (full Choose flow)

Copy from panel quote card must match the user's selected outgoing message (clipboard or accessibility).

### 5. Permissions and lifecycle

- Gate `startBubble()` on `canDrawOverlays()`; otherwise reject with code `OVERLAY_DENIED`.
- Re-check overlay permission on `onStart()` after user returns from settings.
- Stop service when user disables bubble in Settings or revokes overlay permission.

## Expo config wiring

Add to `app.json` when the plugin is ready:

```json
{
  "expo": {
    "plugins": ["./plugins/with-android-bubble"]
  }
}
```

## Operational notes

- Overlay testing requires a dev client or release build; Expo Go cannot draw over other apps.
- Re-run `npx expo prebuild --clean` after plugin changes.
- Foreground service notification copy must follow Sentient brand rules (no "AI", no exclamation marks).
