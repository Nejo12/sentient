# Android Floating Bubble Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Android entry point for Sentient — a persistent, draggable floating bubble that, on tap, reads the clipboard and deep-links into the existing Choose screen — plus regenerate the app icon to match the brand instead of the current default Expo template icon.

**Architecture:** An Expo config plugin (`plugins/with-android-bubble/`) copies hand-written Kotlin sources into the generated Android project at prebuild time, declares a foreground service in the manifest, and registers the native module in `MainApplication`. The JS side gets a thin wrapper (`src/services/bubbleService.ts`) parallel to the existing `overlayPermission.ts`, wired into `app/setup.tsx`'s existing permission flow. No new deep-link parsing is needed — the bubble reuses the exact `sentient://choose?message=...&sourceApp=...` scheme the iOS Share Extension already produces.

**Tech Stack:** Expo config plugins (`@expo/config-plugins`), Kotlin (`Service`, `WindowManager`, `ClipboardManager`), React Native native modules (`ReactContextBaseJavaModule`/`ReactPackage`), `sharp` (SVG→PNG rasterization for icon generation).

## Global Constraints

- Bundle/package identifier: `com.gee1216.sentient` (from `app.json`); Kotlin sources live under package `com.gee1216.sentient.overlay`.
- Brand color oxblood is `#7F3523` (`src/theme/tokens.ts:10`); foreground/glyph color is `#FFFFFF` (`oxbloodFg`, `src/theme/tokens.ts:12`). No other colors in generated brand assets.
- Copy discipline: en-GB, sentence case, no emoji, no exclamation marks, never label anything "AI" (applies to the foreground-service notification text).
- Text capture is clipboard-only for this version — no Accessibility Service.
- Bubble does not need to survive app-process death or device reboot (see spec `docs/superpowers/specs/2026-07-08-android-bubble-design.md` §2).
- Every JS/TS change needs a passing Jest test; there is no Kotlin test harness in this repo, so native-only changes are verified manually on-device (matches how the iOS Share Extension fix was verified in this repo's history).

---

### Task 0: Set up the Android build environment

**Files:** None (environment/tooling only).

**Interfaces:** None — this task produces no code, only a working local Android toolchain that later tasks depend on.

- [ ] **Step 1: Install Android Studio via Homebrew**

Run:
```bash
brew install --cask android-studio
```
Expected: installs to `/Applications/Android Studio.app`.

- [ ] **Step 2: Launch Android Studio and complete the first-run Setup Wizard**

Open `/Applications/Android Studio.app`. Accept the default "Standard" install type when prompted — this installs the Android SDK, platform-tools, and a default system image.

- [ ] **Step 3: Verify the SDK and `adb` are on PATH**

Run:
```bash
$HOME/Library/Android/sdk/platform-tools/adb version
```
Expected: prints an Android Debug Bridge version line (e.g. `Android Debug Bridge version 1.0.41`). If this is not found, the Setup Wizard installed the SDK to a different location — check **Android Studio → Settings → Languages & Frameworks → Android SDK** for the actual "Android SDK Location" path.

- [ ] **Step 4: Create a virtual device (if not testing on a physical phone)**

In Android Studio: **More Actions → Virtual Device Manager → Create Device**. Pick a Pixel profile, use the system image installed by the Setup Wizard, finish, then click the launch (▶) icon next to the created device.

Alternatively, for a physical device: enable Developer Options (Settings → About phone → tap "Build number" 7 times) → **Settings → Developer options → USB debugging** → connect via USB → accept the "Allow USB debugging?" prompt on the phone.

- [ ] **Step 5: Verify a device is visible**

Run:
```bash
$HOME/Library/Android/sdk/platform-tools/adb devices
```
Expected: lists at least one device/emulator with state `device` (not `unauthorized` or `offline`).

- [ ] **Step 6: Confirm the project builds for Android**

Run:
```bash
npx expo prebuild --clean --platform android
```
Expected: completes with `✔ Finished prebuild` and creates an `android/` directory (gitignored, same as `ios/`).

---

### Task 1: Regenerate brand-matching app icon assets

**Files:**
- Create: `scripts/generate-brand-icons.js`
- Create: `__tests__/generate-brand-icons.test.js`
- Modify (generated output, not hand-edited): `assets/images/icon.png`, `assets/images/android-icon-foreground.png`, `assets/images/android-icon-background.png`, `assets/images/android-icon-monochrome.png`, `assets/images/splash-icon.png`

**Interfaces:**
- Produces: `buildIconSvg({ size, includeBackground, insetRatio })` — exported from `scripts/generate-brand-icons.js`, returns an SVG string. Used directly by this script's own `main()`, and imported by its test.

- [ ] **Step 1: Add `sharp` as a devDependency**

Run:
```bash
npm install --save-dev sharp
```
Expected: adds `sharp` to `package.json`'s `devDependencies` and updates `package-lock.json`.

- [ ] **Step 2: Write the failing test for the SVG builder**

Create `__tests__/generate-brand-icons.test.js`:

```js
const { buildIconSvg } = require('../scripts/generate-brand-icons');

describe('buildIconSvg', () => {
  it('draws the oxblood background by default', () => {
    const svg = buildIconSvg({ size: 100 });

    expect(svg).toContain('fill="#7F3523"');
    expect(svg).toContain('width="100" height="100"');
  });

  it('omits the background rect when includeBackground is false', () => {
    const svg = buildIconSvg({ size: 100, includeBackground: false });

    expect(svg).not.toContain('fill="#7F3523"');
  });

  it('always draws the message-circle and heart paths in white', () => {
    const svg = buildIconSvg({ size: 100 });

    expect(svg).toContain('M7.9 20A9 9 0 1 0 4 16.1L2 22Z');
    expect(svg).toContain('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3');
    expect(svg).toContain('stroke="#FFFFFF"');
    expect(svg).toContain('fill="#FFFFFF"');
  });

  it('insets the glyph group when insetRatio is provided', () => {
    const full = buildIconSvg({ size: 100 });
    const inset = buildIconSvg({ size: 100, insetRatio: 0.6 });

    expect(inset).not.toEqual(full);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/generate-brand-icons.test.js -v`
Expected: FAIL with `Cannot find module '../scripts/generate-brand-icons'`.

- [ ] **Step 3: Write `scripts/generate-brand-icons.js`**

```js
#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const OXBLOOD = '#7F3523';
const OXBLOOD_FG = '#FFFFFF';

// Matches src/components/BrandMark.tsx exactly:
// - rounded-square tile, radius = size * 0.33
// - message-circle glyph, size = max(12, size * 0.48)
// - heart badge, size = max(9, size * 0.3), offset from the 30px reference
//   BrandMark uses (right: 5, bottom: 4), scaled proportionally here since
//   BrandMark's fixed pixel offsets only make sense at UI sizes (26-66px).
const MESSAGE_CIRCLE_PATH = 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z';
const HEART_PATH =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';
const REFERENCE_SIZE = 30;
const REFERENCE_HEART_RIGHT = 5;
const REFERENCE_HEART_BOTTOM = 4;

/**
 * @param {{ size: number, includeBackground?: boolean, insetRatio?: number }} options
 * @returns {string} SVG markup
 */
function buildIconSvg({ size, includeBackground = true, insetRatio = 1 }) {
  const canvas = size;
  const groupSize = size * insetRatio;
  const groupOffset = (size - groupSize) / 2;

  const radius = Math.round(groupSize * 0.33);
  const iconSize = Math.max(12, Math.round(groupSize * 0.48));
  const heartSize = Math.max(9, Math.round(groupSize * 0.3));

  const iconX = groupOffset + (groupSize - iconSize) / 2;
  const iconY = groupOffset + (groupSize - iconSize) / 2;

  const heartRight = (REFERENCE_HEART_RIGHT / REFERENCE_SIZE) * groupSize;
  const heartBottom = (REFERENCE_HEART_BOTTOM / REFERENCE_SIZE) * groupSize;
  const heartX = groupOffset + groupSize - heartSize - heartRight;
  const heartY = groupOffset + groupSize - heartSize - heartBottom;

  const backgroundRect = includeBackground
    ? `<rect x="${groupOffset}" y="${groupOffset}" width="${groupSize}" height="${groupSize}" rx="${radius}" fill="${OXBLOOD}" />`
    : '';

  return `<svg width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}" xmlns="http://www.w3.org/2000/svg">
  ${backgroundRect}
  <svg x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${OXBLOOD_FG}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path d="${MESSAGE_CIRCLE_PATH}" />
  </svg>
  <svg x="${heartX}" y="${heartY}" width="${heartSize}" height="${heartSize}" viewBox="0 0 24 24">
    <path d="${HEART_PATH}" fill="${OXBLOOD_FG}" />
  </svg>
</svg>`;
}

async function renderPng(svg, outputPath, size) {
  const sharp = require('sharp');
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`wrote ${outputPath}`);
}

async function main() {
  const assetsDir = path.join(__dirname, '..', 'assets', 'images');

  await renderPng(buildIconSvg({ size: 1024 }), path.join(assetsDir, 'icon.png'), 1024);
  await renderPng(buildIconSvg({ size: 1024 }), path.join(assetsDir, 'splash-icon.png'), 1024);

  // Adaptive icon foreground: transparent background, glyph inset to
  // Android's ~66/108 safe zone so it isn't clipped by the system mask.
  await renderPng(
    buildIconSvg({ size: 512, includeBackground: false, insetRatio: 0.61 }),
    path.join(assetsDir, 'android-icon-foreground.png'),
    512,
  );

  // Adaptive icon background: solid oxblood, no glyph.
  await renderPng(
    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="${OXBLOOD}" /></svg>`,
    path.join(assetsDir, 'android-icon-background.png'),
    512,
  );

  // Themed monochrome layer (Android 13+): single-color glyph, no background.
  await renderPng(
    buildIconSvg({ size: 432, includeBackground: false, insetRatio: 0.61 }),
    path.join(assetsDir, 'android-icon-monochrome.png'),
    432,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { buildIconSvg };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/generate-brand-icons.test.js -v`
Expected: PASS, 4 tests.

- [ ] **Step 5: Generate the actual icon files**

Run:
```bash
node scripts/generate-brand-icons.js
```
Expected: prints 5 `wrote ...` lines, one per asset file listed above.

- [ ] **Step 6: Visually confirm the output**

Open `assets/images/icon.png` and `assets/images/android-icon-foreground.png` and confirm: oxblood rounded-square tile (for `icon.png`), white message-circle outline centered, small white filled heart bottom-right — matching what `BrandMark` renders in the app today. No leftover blue chevron or construction guides from the old default icon.

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-brand-icons.js __tests__/generate-brand-icons.test.js assets/images/icon.png assets/images/splash-icon.png assets/images/android-icon-foreground.png assets/images/android-icon-background.png assets/images/android-icon-monochrome.png package.json package-lock.json
git commit -m "feat: regenerate app icon to match Sentient brand mark"
```

---

### Task 2: Config plugin — foreground service manifest declaration

**Files:**
- Create: `plugins/with-android-bubble/index.js`
- Create: `__tests__/with-android-bubble.test.js`
- Modify: `app.json`

**Interfaces:**
- Produces: `module.exports` (default) — the config plugin function, called by Expo as `withAndroidBubble(config)`. Also exports `addBubbleServiceToManifest(androidManifest)` for direct testing.
- Consumes: nothing from other tasks yet.

- [ ] **Step 1: Write the failing test**

Create `__tests__/with-android-bubble.test.js`:

```js
const { addBubbleServiceToManifest } = require('../plugins/with-android-bubble');

function baseManifest() {
  return {
    manifest: {
      application: [
        {
          $: { 'android:name': '.MainApplication' },
        },
      ],
    },
  };
}

describe('addBubbleServiceToManifest', () => {
  it('adds the BubbleOverlayService declaration', () => {
    const result = addBubbleServiceToManifest(baseManifest());
    const application = result.manifest.application[0];

    expect(Array.isArray(application.service)).toBe(true);
    const service = application.service.find(
      (item) => item.$['android:name'] === '.overlay.BubbleOverlayService',
    );
    expect(service).toBeTruthy();
    expect(service.$['android:foregroundServiceType']).toBe('specialUse');
    expect(service.$['android:exported']).toBe('false');
  });

  it('does not duplicate the service on a second run', () => {
    const once = addBubbleServiceToManifest(baseManifest());
    const twice = addBubbleServiceToManifest(once);

    expect(twice.manifest.application[0].service).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/with-android-bubble.test.js -v`
Expected: FAIL with `Cannot find module '../plugins/with-android-bubble'`.

- [ ] **Step 3: Write `plugins/with-android-bubble/index.js`**

```js
const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = '.overlay.BubbleOverlayService';

/** Adds the BubbleOverlayService foreground-service declaration to the manifest's <application>. */
function addBubbleServiceToManifest(androidManifest) {
  const { manifest } = androidManifest;
  const application = manifest.application[0];

  if (!Array.isArray(application.service)) {
    application.service = [];
  }

  const alreadyPresent = application.service.some(
    (item) => item.$['android:name'] === SERVICE_NAME,
  );
  if (alreadyPresent) {
    return androidManifest;
  }

  application.service.push({
    $: {
      'android:name': SERVICE_NAME,
      'android:enabled': 'true',
      'android:exported': 'false',
      'android:foregroundServiceType': 'specialUse',
    },
    property: [
      {
        $: {
          'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
          'android:value':
            'Persistent floating shortcut to reply-help features while using other apps',
        },
      },
    ],
  });

  return androidManifest;
}

function withAndroidBubble(config) {
  return withAndroidManifest(config, (configMod) => {
    configMod.modResults = addBubbleServiceToManifest(configMod.modResults);
    return configMod;
  });
}

module.exports = withAndroidBubble;
module.exports.addBubbleServiceToManifest = addBubbleServiceToManifest;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/with-android-bubble.test.js -v`
Expected: PASS, 2 tests.

- [ ] **Step 5: Wire the plugin into `app.json`**

In `app.json`, add `"./plugins/with-android-bubble"` to the `plugins` array (order doesn't matter relative to the iOS-only plugins, since this mod only touches the Android manifest):

```json
      "./plugins/with-ios-share-text-fix",
      "./plugins/with-android-bubble",
```

- [ ] **Step 6: Verify the manifest change against a real prebuild**

Run:
```bash
npx expo prebuild --clean --platform android
grep -A5 "BubbleOverlayService" android/app/src/main/AndroidManifest.xml
```
Expected: shows the `<service>` element with `android:foregroundServiceType="specialUse"` and the `<property>` child.

- [ ] **Step 7: Commit**

```bash
git add plugins/with-android-bubble/index.js __tests__/with-android-bubble.test.js app.json
git commit -m "feat: declare Android bubble foreground service via config plugin"
```

---

### Task 3: Native module bridge + Kotlin source copying

**Files:**
- Create: `plugins/with-android-bubble/android-src/overlay/SentientOverlayModule.kt`
- Create: `plugins/with-android-bubble/android-src/overlay/SentientOverlayPackage.kt`
- Modify: `plugins/with-android-bubble/index.js`
- Create: `__tests__/with-android-bubble-copy.test.js`

**Interfaces:**
- Produces (Kotlin, consumed by Task 5+): `SentientOverlayModule.getName() == "SentientOverlay"`; methods `canDrawOverlays(promise)`, `startBubble(promise)`, `stopBubble(promise)`, `isBubbleRunning(promise)`. Depends on `BubbleOverlayService` (created in Task 5) only by class reference — compiles once Task 5 adds that file, so on-device verification of `startBubble`/`stopBubble` waits until then; `canDrawOverlays` and `isBubbleRunning` (reading a static var Task 5 defines) can be verified once Task 5 lands too. This task focuses on getting the bridge copied and registered correctly.
- Produces (JS-testable): `copyAndroidSources(androidSrcDir, destJavaDir)` and `registerPackageInMainApplication(mainApplicationFile)`, both exported from `plugins/with-android-bubble/index.js`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/with-android-bubble-copy.test.js`:

```js
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  copyAndroidSources,
  registerPackageInMainApplication,
} = require('../plugins/with-android-bubble');

describe('copyAndroidSources', () => {
  it('copies the overlay Kotlin sources into the destination java directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentient-bubble-copy-'));

    copyAndroidSources(
      path.join(__dirname, '../plugins/with-android-bubble/android-src'),
      tempDir,
    );

    expect(fs.existsSync(path.join(tempDir, 'overlay', 'SentientOverlayModule.kt'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'overlay', 'SentientOverlayPackage.kt'))).toBe(true);
  });
});

describe('registerPackageInMainApplication', () => {
  it('adds the import and packages.add call for a Kotlin MainApplication', () => {
    const original = `
package com.gee1216.sentient

class MainApplication : Application(), ReactApplication {
  override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages
    return packages
  }
}
`.trim();

    const patched = registerPackageInMainApplication({
      contents: original,
      language: 'kt',
    });

    expect(patched).toContain('import com.gee1216.sentient.overlay.SentientOverlayPackage');
    expect(patched).toContain('packages.add(SentientOverlayPackage())');
  });

  it('does not duplicate the registration on a second run', () => {
    const original = `
package com.gee1216.sentient

class MainApplication : Application(), ReactApplication {
  override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages
    return packages
  }
}
`.trim();

    const once = registerPackageInMainApplication({ contents: original, language: 'kt' });
    const twice = registerPackageInMainApplication({ contents: once, language: 'kt' });

    expect(twice.match(/packages\.add\(SentientOverlayPackage\(\)\)/g)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/with-android-bubble-copy.test.js -v`
Expected: FAIL — `copyAndroidSources` and `registerPackageInMainApplication` are not exported yet.

- [ ] **Step 3: Write the Kotlin bridge sources**

Create `plugins/with-android-bubble/android-src/overlay/SentientOverlayModule.kt`:

```kotlin
package com.gee1216.sentient.overlay

import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SentientOverlayModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SentientOverlay"

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
    }

    @ReactMethod
    fun startBubble(promise: Promise) {
        val context = reactApplicationContext
        if (!Settings.canDrawOverlays(context)) {
            promise.reject("OVERLAY_DENIED", "Overlay permission is not granted")
            return
        }

        val intent = Intent(context, BubbleOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun stopBubble(promise: Promise) {
        val context = reactApplicationContext
        context.stopService(Intent(context, BubbleOverlayService::class.java))
        promise.resolve(null)
    }

    @ReactMethod
    fun isBubbleRunning(promise: Promise) {
        promise.resolve(BubbleOverlayService.isRunning)
    }
}
```

Create `plugins/with-android-bubble/android-src/overlay/SentientOverlayPackage.kt`:

```kotlin
package com.gee1216.sentient.overlay

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SentientOverlayPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(SentientOverlayModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
```

Note: this references `BubbleOverlayService`, which does not exist until Task 5. That's expected — Kotlin compilation of the full Android project will fail between this task and Task 5. This plan's tasks are ordered for reviewability (bridge shape first, then the service it drives), not for a green build after every single task; Task 5's on-device check is the first point a full build is expected to succeed.

- [ ] **Step 4: Extend `plugins/with-android-bubble/index.js` with the copy and registration helpers**

Replace the entire contents of `plugins/with-android-bubble/index.js` with:

```js
const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const SERVICE_NAME = '.overlay.BubbleOverlayService';
const PACKAGE_IMPORT = 'import com.gee1216.sentient.overlay.SentientOverlayPackage';
const PACKAGE_ADD_CALL = 'packages.add(SentientOverlayPackage())';

/** Adds the BubbleOverlayService foreground-service declaration to the manifest's <application>. */
function addBubbleServiceToManifest(androidManifest) {
  const { manifest } = androidManifest;
  const application = manifest.application[0];

  if (!Array.isArray(application.service)) {
    application.service = [];
  }

  const alreadyPresent = application.service.some(
    (item) => item.$['android:name'] === SERVICE_NAME,
  );
  if (alreadyPresent) {
    return androidManifest;
  }

  application.service.push({
    $: {
      'android:name': SERVICE_NAME,
      'android:enabled': 'true',
      'android:exported': 'false',
      'android:foregroundServiceType': 'specialUse',
    },
    property: [
      {
        $: {
          'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
          'android:value':
            'Persistent floating shortcut to reply-help features while using other apps',
        },
      },
    ],
  });

  return androidManifest;
}

/** Recursively copies the plugin's Kotlin sources into the generated java/ source tree. */
function copyAndroidSources(androidSrcDir, destJavaDir) {
  fs.mkdirSync(destJavaDir, { recursive: true });

  for (const entry of fs.readdirSync(androidSrcDir, { withFileTypes: true })) {
    const srcPath = path.join(androidSrcDir, entry.name);
    const destPath = path.join(destJavaDir, entry.name);

    if (entry.isDirectory()) {
      copyAndroidSources(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Adds the SentientOverlayPackage import + packages.add() call to MainApplication. */
function registerPackageInMainApplication({ contents, language }) {
  if (language !== 'kt') {
    throw new Error(
      `[with-android-bubble] Expected Kotlin MainApplication, got "${language}" — update the plugin for Java support.`,
    );
  }

  let result = contents;

  if (!result.includes(PACKAGE_IMPORT)) {
    result = result.replace(
      /^package com\.gee1216\.sentient$/m,
      `package com.gee1216.sentient\n\n${PACKAGE_IMPORT}`,
    );
  }

  if (!result.includes(PACKAGE_ADD_CALL)) {
    result = result.replace(
      /(val packages = PackageList\(this\)\.packages)/,
      `$1\n    ${PACKAGE_ADD_CALL}`,
    );
  }

  return result;
}

function withAndroidBubbleSources(config) {
  return withDangerousMod(config, [
    'android',
    (configMod) => {
      const androidSrcDir = path.join(__dirname, 'android-src');
      const destJavaDir = path.join(
        configMod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'gee1216',
        'sentient',
      );
      copyAndroidSources(androidSrcDir, destJavaDir);
      return configMod;
    },
  ]);
}

function withAndroidBubbleMainApplication(config) {
  return withMainApplication(config, (configMod) => {
    configMod.modResults.contents = registerPackageInMainApplication(configMod.modResults);
    return configMod;
  });
}

function withAndroidBubble(config) {
  let result = withAndroidManifest(config, (configMod) => {
    configMod.modResults = addBubbleServiceToManifest(configMod.modResults);
    return configMod;
  });
  result = withAndroidBubbleSources(result);
  result = withAndroidBubbleMainApplication(result);
  return result;
}

module.exports = withAndroidBubble;
module.exports.addBubbleServiceToManifest = addBubbleServiceToManifest;
module.exports.copyAndroidSources = copyAndroidSources;
module.exports.registerPackageInMainApplication = registerPackageInMainApplication;
```

Replace the whole file with this combined version (it supersedes the Task 2 version, keeping `addBubbleServiceToManifest` unchanged).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/with-android-bubble.test.js __tests__/with-android-bubble-copy.test.js -v`
Expected: PASS, 4 tests total.

- [ ] **Step 6: Verify against a real prebuild**

Run:
```bash
npx expo prebuild --clean --platform android
find android/app/src/main/java/com/gee1216/sentient/overlay -type f
grep -n "SentientOverlayPackage" android/app/src/main/java/com/gee1216/sentient/MainApplication.kt
```
Expected: the `overlay/` directory lists `SentientOverlayModule.kt` and `SentientOverlayPackage.kt`; the grep shows both the import and the `packages.add(...)` line.

- [ ] **Step 7: Commit**

```bash
git add plugins/with-android-bubble/
git commit -m "feat: add Sentient overlay native module bridge and registration"
```

---

### Task 4: JS wrapper — `bubbleService.ts`

**Files:**
- Create: `src/services/bubbleService.ts`
- Create: `__tests__/bubbleService.test.ts`

**Interfaces:**
- Consumes: `NativeModules.SentientOverlay` (from Task 3's Kotlin bridge — methods `startBubble`, `stopBubble`, `isBubbleRunning`, `canDrawOverlays`, all `Promise`-returning).
- Produces: `startBubble(): Promise<void>`, `stopBubble(): Promise<void>`, `isBubbleRunning(): Promise<boolean>` — used by Task 8's `app/setup.tsx` change.

- [ ] **Step 1: Write the failing test**

Create `__tests__/bubbleService.test.ts`:

```ts
import { NativeModules, Platform } from 'react-native';

import { isBubbleRunning, startBubble, stopBubble } from '../src/services/bubbleService';

describe('bubbleService', () => {
  beforeEach(() => {
    (NativeModules as Record<string, unknown>).SentientOverlay = {
      startBubble: jest.fn().mockResolvedValue(undefined),
      stopBubble: jest.fn().mockResolvedValue(undefined),
      isBubbleRunning: jest.fn().mockResolvedValue(true),
    };
    Platform.OS = 'android';
  });

  it('calls the native startBubble on Android', async () => {
    await startBubble();
    expect(NativeModules.SentientOverlay.startBubble).toHaveBeenCalled();
  });

  it('calls the native stopBubble on Android', async () => {
    await stopBubble();
    expect(NativeModules.SentientOverlay.stopBubble).toHaveBeenCalled();
  });

  it('returns the native isBubbleRunning result on Android', async () => {
    await expect(isBubbleRunning()).resolves.toBe(true);
  });

  it('is a no-op on iOS', async () => {
    Platform.OS = 'ios';
    (NativeModules as Record<string, unknown>).SentientOverlay = undefined;

    await expect(startBubble()).resolves.toBeUndefined();
    await expect(stopBubble()).resolves.toBeUndefined();
    await expect(isBubbleRunning()).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/bubbleService.test.ts -v`
Expected: FAIL with `Cannot find module '../src/services/bubbleService'`.

- [ ] **Step 3: Write `src/services/bubbleService.ts`**

```ts
import { NativeModules, Platform } from 'react-native';

type SentientOverlayNativeModule = {
  startBubble?: () => Promise<void>;
  stopBubble?: () => Promise<void>;
  isBubbleRunning?: () => Promise<boolean>;
};

function getSentientOverlayModule(): SentientOverlayNativeModule | undefined {
  return NativeModules.SentientOverlay as SentientOverlayNativeModule | undefined;
}

/** Starts the floating bubble foreground service. No-op on iOS. */
export async function startBubble(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await getSentientOverlayModule()?.startBubble?.();
}

/** Stops the floating bubble foreground service. No-op on iOS. */
export async function stopBubble(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await getSentientOverlayModule()?.stopBubble?.();
}

/** Whether the bubble service is currently running. Always false on iOS. */
export async function isBubbleRunning(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  return (await getSentientOverlayModule()?.isBubbleRunning?.()) ?? false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/bubbleService.test.ts -v`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/bubbleService.ts __tests__/bubbleService.test.ts
git commit -m "feat: add JS wrapper for the Android bubble native module"
```

---

### Task 5: Foreground service with a fixed-position overlay bubble

**Files:**
- Create: `plugins/with-android-bubble/android-src/overlay/BubbleOverlayService.kt`
- Create: `plugins/with-android-bubble/android-src/res/drawable/bubble_glyph.png`
- Modify: `scripts/generate-brand-icons.js` (add the bubble glyph output)
- Modify: `plugins/with-android-bubble/index.js` (copy `res/` alongside `overlay/`)

**Interfaces:**
- Produces: `BubbleOverlayService` (Kotlin `Service`), `BubbleOverlayService.isRunning: Boolean` (static, read by `SentientOverlayModule.isBubbleRunning` from Task 3). No touch/drag handling yet — bubble is drawn at a fixed position. No tap handling yet — added in Task 7.

- [ ] **Step 1: Add the bubble glyph output to the icon generator**

In `scripts/generate-brand-icons.js`, add to `main()` (after the existing five `renderPng` calls):

```js
  // Bubble glyph for the Android floating bubble overlay: same composition,
  // rendered at a fixed raster large enough for xxhdpi without density variants.
  const bubbleGlyphDir = path.join(
    __dirname,
    '..',
    'plugins',
    'with-android-bubble',
    'android-src',
    'res',
    'drawable',
  );
  fs.mkdirSync(bubbleGlyphDir, { recursive: true });
  await renderPng(buildIconSvg({ size: 168 }), path.join(bubbleGlyphDir, 'bubble_glyph.png'), 168);
```

Add `const fs = require('node:fs');` is already imported at the top of the file from Task 1 — no new import needed.

- [ ] **Step 2: Regenerate and verify**

Run:
```bash
node scripts/generate-brand-icons.js
file plugins/with-android-bubble/android-src/res/drawable/bubble_glyph.png
```
Expected: prints a `wrote .../bubble_glyph.png` line, and `file` reports a 168x168 PNG.

- [ ] **Step 3: Write `BubbleOverlayService.kt`**

Create `plugins/with-android-bubble/android-src/overlay/BubbleOverlayService.kt`:

```kotlin
package com.gee1216.sentient.overlay

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import androidx.core.app.NotificationCompat

class BubbleOverlayService : Service() {

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "sentient_bubble"
        const val NOTIFICATION_ID = 1001
        const val BUBBLE_SIZE_DP = 56
        var isRunning: Boolean = false
            private set
    }

    private lateinit var windowManager: WindowManager
    private var bubbleView: View? = null
    private lateinit var layoutParams: WindowManager.LayoutParams

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        startForeground(NOTIFICATION_ID, buildNotification())
        addBubbleView()
        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        bubbleView?.let { windowManager.removeView(it) }
        bubbleView = null
        isRunning = false
    }

    private fun buildNotification(): android.app.Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = manager.getNotificationChannel(NOTIFICATION_CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Sentient bubble",
                    NotificationManager.IMPORTANCE_MIN,
                )
                manager.createNotificationChannel(channel)
            }
        }

        val openAppIntent = packageManager.getLaunchIntentForPackage(packageName)
        val contentPendingIntent = openAppIntent?.let {
            PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE)
        }

        val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Sentient is ready to help")
            .setSmallIcon(applicationInfo.icon)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)

        contentPendingIntent?.let { builder.setContentIntent(it) }

        return builder.build()
    }

    private fun density(): Float = resources.displayMetrics.density

    private fun addBubbleView() {
        val bubble = ImageView(this)
        bubble.setImageResource(R.drawable.bubble_glyph)
        val sizePx = (BUBBLE_SIZE_DP * density()).toInt()

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            sizePx,
            sizePx,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT,
        )
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 0
        layoutParams.y = (238 * density()).toInt()

        windowManager.addView(bubble, layoutParams)
        bubbleView = bubble
    }
}
```

- [ ] **Step 4: Copy the drawable resource alongside the Kotlin sources**

In `plugins/with-android-bubble/index.js`, modify `withAndroidBubbleSources` to also copy `res/`:

```js
function withAndroidBubbleSources(config) {
  return withDangerousMod(config, [
    'android',
    (configMod) => {
      const pluginRoot = path.join(__dirname, 'android-src');
      const androidAppMain = path.join(configMod.modRequest.platformProjectRoot, 'app', 'src', 'main');

      copyAndroidSources(
        path.join(pluginRoot, 'overlay'),
        path.join(androidAppMain, 'java', 'com', 'gee1216', 'sentient', 'overlay'),
      );
      copyAndroidSources(path.join(pluginRoot, 'res'), path.join(androidAppMain, 'res'));

      return configMod;
    },
  ]);
}
```

(This changes the first argument shape from Task 3 — `copyAndroidSources` itself is unchanged, only the two call sites for `overlay/` and `res/` are now explicit instead of one call for the whole `android-src` directory root.)

- [ ] **Step 5: Update the copy test for the new call shape**

In `__tests__/with-android-bubble-copy.test.js`, update the first test to call `copyAndroidSources` against the `overlay` subdirectory directly (matching the new call site):

```js
  it('copies the overlay Kotlin sources into the destination java directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentient-bubble-copy-'));

    copyAndroidSources(
      path.join(__dirname, '../plugins/with-android-bubble/android-src/overlay'),
      tempDir,
    );

    expect(fs.existsSync(path.join(tempDir, 'SentientOverlayModule.kt'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'SentientOverlayPackage.kt'))).toBe(true);
  });
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest __tests__/with-android-bubble.test.js __tests__/with-android-bubble-copy.test.js -v`
Expected: PASS, 4 tests total.

- [ ] **Step 7: Build and run on-device**

Run:
```bash
npx expo prebuild --clean --platform android
npx expo run:android
```
Expected: builds successfully (this is the first point the whole Android project compiles, since `BubbleOverlayService` now exists). On the connected device/emulator: complete Setup, grant "Draw over other apps" when prompted (this step doesn't auto-start the bubble yet — that's Task 8 — so manually trigger it for verification by running, from a JS debugger console or a temporary button, `NativeModules.SentientOverlay.startBubble()`).

- [ ] **Step 8: Manually verify**

Expected: a 56dp oxblood circular bubble with the white message-circle+heart glyph appears near the right edge of the screen, over other apps, with the "Sentient is ready to help" notification visible in the status bar/notification shade.

- [ ] **Step 9: Commit**

```bash
git add plugins/with-android-bubble/ scripts/generate-brand-icons.js __tests__/with-android-bubble-copy.test.js
git commit -m "feat: draw the fixed-position overlay bubble in a foreground service"
```

---

### Task 6: Drag and snap-to-edge

**Files:**
- Modify: `plugins/with-android-bubble/android-src/overlay/BubbleOverlayService.kt`

**Interfaces:**
- No new JS-facing interface — purely native touch handling on the view created in Task 5.

- [ ] **Step 1: Add drag state fields and imports**

In `BubbleOverlayService.kt`, add to the imports:

```kotlin
import android.view.MotionEvent
import kotlin.math.abs
```

Add fields alongside the existing `bubbleView`/`layoutParams` fields:

```kotlin
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var hasMoved = false

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "sentient_bubble"
        const val NOTIFICATION_ID = 1001
        const val BUBBLE_SIZE_DP = 56
        const val TAP_MOVE_THRESHOLD_PX = 12
        var isRunning: Boolean = false
            private set
    }
```

(This replaces the existing `companion object` block from Task 5 — same members plus `TAP_MOVE_THRESHOLD_PX`.)

- [ ] **Step 2: Add the touch listener in `addBubbleView()`**

In `addBubbleView()`, before the `windowManager.addView(bubble, layoutParams)` call, add:

```kotlin
        bubble.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    hasMoved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (abs(dx) > TAP_MOVE_THRESHOLD_PX || abs(dy) > TAP_MOVE_THRESHOLD_PX) {
                        hasMoved = true
                    }
                    layoutParams.x = initialX + dx
                    layoutParams.y = initialY + dy
                    windowManager.updateViewLayout(view, layoutParams)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (hasMoved) {
                        snapToEdge()
                    }
                    true
                }
                else -> false
            }
        }
```

- [ ] **Step 3: Add the `snapToEdge()` method**

Add as a new private method on `BubbleOverlayService`:

```kotlin
    private fun snapToEdge() {
        val screenWidth = resources.displayMetrics.widthPixels
        val bubbleCenterX = layoutParams.x + layoutParams.width / 2
        layoutParams.x = if (bubbleCenterX < screenWidth / 2) {
            0
        } else {
            screenWidth - layoutParams.width
        }
        bubbleView?.let { windowManager.updateViewLayout(it, layoutParams) }
    }
```

- [ ] **Step 4: Build and run on-device**

Run:
```bash
npx expo run:android
```

- [ ] **Step 5: Manually verify**

Expected: dragging the bubble moves it smoothly with the finger; releasing it animates/snaps it to whichever edge (left or right) is nearer.

- [ ] **Step 6: Commit**

```bash
git add plugins/with-android-bubble/android-src/overlay/BubbleOverlayService.kt
git commit -m "feat: add drag and snap-to-edge to the overlay bubble"
```

---

### Task 7: Tap detection, clipboard read, and deep-link launch

**Files:**
- Modify: `plugins/with-android-bubble/android-src/overlay/BubbleOverlayService.kt`

**Interfaces:**
- Produces: on tap, fires `Intent(ACTION_VIEW, sentient://choose?message=<clipboard>&sourceApp=Android)` — consumed by the app's existing deep-link handling in `app/(flow)/choose.tsx` (already built for iOS; no changes needed there).

- [ ] **Step 1: Add the clipboard/Uri imports**

Add to `BubbleOverlayService.kt`'s imports:

```kotlin
import android.content.ClipboardManager
import android.net.Uri
```

- [ ] **Step 2: Distinguish tap from drag in `ACTION_UP`**

Replace the `ACTION_UP` branch from Task 6 with:

```kotlin
                MotionEvent.ACTION_UP -> {
                    if (hasMoved) {
                        snapToEdge()
                    } else {
                        onBubbleTapped()
                    }
                    true
                }
```

- [ ] **Step 3: Add the `onBubbleTapped()` method**

```kotlin
    private fun onBubbleTapped() {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clipText = clipboard.primaryClip
            ?.takeIf { it.itemCount > 0 }
            ?.getItemAt(0)
            ?.coerceToText(this)
            ?.toString()
            ?.trim()

        val uriBuilder = Uri.parse("sentient://choose").buildUpon()
        uriBuilder.appendQueryParameter("sourceApp", "Android")
        if (!clipText.isNullOrEmpty()) {
            uriBuilder.appendQueryParameter("message", clipText)
        }

        val launchIntent = Intent(Intent.ACTION_VIEW, uriBuilder.build()).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(launchIntent)
    }
```

- [ ] **Step 4: Build and run on-device**

Run:
```bash
npx expo run:android
```

- [ ] **Step 5: Manually verify the happy path**

1. Copy some text in any other app (e.g. Chrome, Messages).
2. Tap the bubble (a clean tap, not a drag).
3. Expected: Sentient opens/resumes directly on the Choose screen with the copied text shown in the quote card.

- [ ] **Step 6: Manually verify the empty-clipboard path**

1. Clear the clipboard (or copy something that isn't text, e.g. an image) and tap the bubble.
2. Expected: Sentient opens Choose with its existing empty-state quote card (no crash, no native error).

- [ ] **Step 7: Commit**

```bash
git add plugins/with-android-bubble/android-src/overlay/BubbleOverlayService.kt
git commit -m "feat: read clipboard and deep-link to Choose on bubble tap"
```

---

### Task 8: Auto-start the bubble from Setup

**Files:**
- Modify: `app/setup.tsx`
- Modify: `__tests__/setup.test.tsx`

**Interfaces:**
- Consumes: `startBubble()`, `stopBubble()` from `src/services/bubbleService.ts` (Task 4).

- [ ] **Step 1: Read the current test file to confirm existing mocks**

Run: `sed -n '1,40p' __tests__/setup.test.tsx`

(This repo's `setup.test.tsx` already mocks `../src/services/overlayPermission` and `../src/services/setupStorage` — add a mock for `bubbleService` alongside them, following the same pattern already used in that file.)

- [ ] **Step 2: Write the failing test**

Add to `__tests__/setup.test.tsx` (alongside the existing `jest.mock` calls near the top):

```ts
jest.mock('../src/services/bubbleService', () => ({
  startBubble: jest.fn().mockResolvedValue(undefined),
  stopBubble: jest.fn().mockResolvedValue(undefined),
}));
```

And add a new test case in the `describe` block:

```ts
  it('starts the bubble once overlay permission is granted on Android', async () => {
    const { requestOverlayPermission, isOverlayPermissionGranted } = jest.requireMock(
      '../src/services/overlayPermission',
    );
    const { startBubble } = jest.requireMock('../src/services/bubbleService');
    Platform.OS = 'android';
    isOverlayPermissionGranted.mockResolvedValue(true);

    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText(strings.setup.overlayTitle));

    await waitFor(() => {
      expect(requestOverlayPermission).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(startBubble).toHaveBeenCalled();
    });
  });
```

(Match the exact import style already used at the top of the file for `Platform`, `strings`, `fireEvent`, `waitFor`, `render`, `SetupScreen` — this repo's existing `setup.test.tsx` already imports all of these.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/setup.test.tsx -v`
Expected: FAIL — `startBubble` is never called yet.

- [ ] **Step 4: Wire `bubbleService` into `app/setup.tsx`**

In `app/setup.tsx`, add the import:

```ts
import { startBubble, stopBubble } from '../src/services/bubbleService';
```

Modify `handleOverlayRowPress` to start the bubble once permission is confirmed:

```ts
  const handleOverlayRowPress = useCallback(async () => {
    await requestOverlayPermission();
    const done = await loadOverlayDoneState();
    setOverlayDone(done);
    if (done) {
      await startBubble();
    }
  }, []);
```

This replaces the existing body of `handleOverlayRowPress` only. `loadOverlayDoneState()` is the async helper already defined at module scope in this file (above the component) — reuse it directly rather than duplicating its logic. Leave `refreshOverlayDone` and the component's other effects unchanged: `refreshOverlayDone` is still called from the mount effect and the `AppState` listener effect below, both of which stay as they are.

Also extend the existing `AppState` "active" listener (used to re-check permission after returning from system settings) to stop the bubble if permission was revoked:

```ts
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshOverlayDone();
        void isOverlayPermissionGranted().then((granted) => {
          if (!granted) {
            void stopBubble();
          }
        });
      }
    });
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/setup.test.tsx -v`
Expected: PASS, all tests including the new one.

- [ ] **Step 6: Run the full test suite**

Run: `npx jest --silent`
Expected: all suites pass.

- [ ] **Step 7: Build and run on-device**

Run:
```bash
npx expo run:android
```

- [ ] **Step 8: Manually verify end-to-end**

1. Fresh install (or clear app data) → open Sentient → Setup screen.
2. Tap "Turn on the keyboard"-equivalent overlay row ("Draw over other apps").
3. Grant the permission in system settings, return to Sentient.
4. Expected: the bubble appears automatically, without any extra tap.
5. Revoke the permission from Android Settings → Apps → Sentient → "Display over other apps" → off, then reopen Sentient.
6. Expected: the bubble disappears (service stops).

- [ ] **Step 9: Commit**

```bash
git add app/setup.tsx __tests__/setup.test.tsx
git commit -m "feat: auto-start and stop the Android bubble from Setup"
```

---

### Task 9: Final on-device verification checklist

**Files:** None — verification only.

- [ ] **Step 1: Full flow from a clean install**

Uninstall the app from the device/emulator, then:
```bash
npx expo run:android
```

- [ ] **Step 2: Walk the whole path**

1. Setup → grant overlay permission → bubble appears automatically.
2. Copy a message's text in any other app.
3. Tap the bubble → Sentient opens directly to Choose with that text shown.
4. Drag the bubble to the opposite edge → it snaps correctly.
5. Pick an intent (What can I do? / What am I missing?) → Compare → Send back, exactly as the existing flow already works.
6. Force-quit Sentient from Android's recent-apps list. Confirm the bubble disappears (no crash, no stale overlay).
7. Reopen Sentient. Confirm the bubble reappears without needing to re-grant permission (Setup should already show the row as done and re-start the bubble — if it doesn't currently do this on plain app reopen rather than only after the permission-grant action, note it as a follow-up; it is explicitly out of scope for this plan per the spec's "no reboot/kill persistence" decision, but reopening the app itself should still restore it since permission state persists).

- [ ] **Step 3: Report results**

If any step fails, file it against the relevant task above rather than patching ad hoc — note which task's behavior didn't match and revisit that task's implementation.

---

## Self-Review Notes

- **Spec coverage:** Architecture (§4) → Tasks 2-3; Components (§5) → Tasks 1, 3, 4, 5; Data flow (§6) → Task 7; Error handling (§7) → Tasks 3 (`OVERLAY_DENIED`), 7 (empty clipboard), 8 (permission revoked → stop); Testing (§8) → every task's Jest step plus Task 9's manual pass; App icon (§5 icon row) → Task 1; Build phases (§9) → map 1:1 to Tasks 0-9 here.
- **Type consistency:** `bubbleService.ts`'s exports (`startBubble`, `stopBubble`, `isBubbleRunning`) match the native module method names used in `SentientOverlayModule.kt` (Task 3) and the calls added in `app/setup.tsx` (Task 8).
- **No placeholders:** every step above includes complete file contents or exact diffs, not descriptions of what to write.
