# Android floating bubble scaffold

## Current approach

Sentient's Android entry point is a chat-head bubble overlay (`TYPE_APPLICATION_OVERLAY`). This task scaffolds permission handling and documents the native module path; the bubble UI and foreground service ship in follow-up work.

- Permission service: `src/services/overlayPermission.ts`
- Native module outline: `plugins/with-android-bubble/README.md`
- Setup screen: Android-only "Draw over other apps" permission row
- Reference screen: `docs/handoff/design_handoff_kindly/screens/06-android-bubble.png`

## Why this is scaffold-only

A floating bubble requires a custom native module (overlay window + foreground service). Expo managed workflow cannot draw over other apps without prebuild and native code. This task wires JS-side permission UX and documents the native implementation.

## Implemented integration points

1. `app.json`
   - Declares `SYSTEM_ALERT_WINDOW` in Android permissions.
2. `src/services/overlayPermission.ts`
   - `isOverlayPermissionGranted()` — iOS stub (always `true`, permission not required); Android checks `SentientOverlay` native module when present, otherwise `false`.
   - `requestOverlayPermission()` — opens `MANAGE_APP_OVERLAY_PERMISSION` for this app via `expo-intent-launcher`.
3. Setup screen
   - Android-only permission row: "Draw over other apps".
   - Opens overlay settings on tap; marks row done when permission is granted or user returns from settings.

## Native requirements (follow-up)

1. **Overlay permission** — `Settings.canDrawOverlays()` exposed through `SentientOverlay` native module.
2. **Foreground service** — keeps the bubble alive when Sentient is backgrounded; show a persistent notification per Android policy.
3. **Bubble window** — `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`, 56px oxblood circle, docked right edge.
4. **Expanded panel** — two intent tiles (`What can I do?` / `What am I missing?`) plus "Open full options in Sentient" deep link.
5. **Text source** — clipboard or accessibility selection (Task 17 steps 3–4).

## Local verification flow

1. Install dependencies:

```bash
npm install
```

2. Build dev client (Expo Go cannot test overlay):

```bash
npx expo prebuild --clean
npx expo run:android
```

3. Open Setup → tap "Draw over other apps" → grant overlay permission in system settings.
4. Confirm the permission row shows the done badge after returning to Sentient.

## If plugin support is insufficient

Follow `plugins/with-android-bubble/README.md` for the full native module (config plugin, Kotlin service, React Native bridge).
