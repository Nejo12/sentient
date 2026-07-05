# with-share-extension (manual fallback)

Use this fallback only when `expo-share-intent` does not cover the required iOS behavior.

## Goal

Create a custom iOS share extension target that forwards selected content into Sentient via:

`sentient://choose?message=<encoded>&sourceApp=<encoded>`

## Required native steps

1. Run prebuild:

```bash
npx expo prebuild --clean
```

2. Open `ios/Sentient.xcworkspace` in Xcode.
3. Add a new target:
   - `File` -> `New` -> `Target...`
   - iOS -> Share Extension
4. Set extension bundle identifier (for example):
   - `com.<team>.sentient.ShareExtension`
5. Configure `Info.plist` activation rules for text and URLs.
6. In extension controller code:
   - read `NSExtensionItem` attachments
   - extract shared text/URL
   - build `sentient://choose?...` URL
   - call `openURL` via responder chain / host app handoff
   - complete extension request

## Expo config-plugin responsibilities

If automating this path, `plugins/with-share-extension` should:

1. Create/update extension target files during prebuild.
2. Ensure app and extension share the same URL scheme (`sentient`).
3. Apply extension `Info.plist` activation rules.
4. Keep target references stable across repeated prebuild runs.

## Operational notes

- Share extension testing requires a dev client or release build.
- Expo Go cannot validate native share extension behavior.
- Re-run prebuild after plugin changes.
