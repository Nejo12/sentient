const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const SERVICE_NAME = '.overlay.BubbleOverlayService';
const PACKAGE_IMPORT = 'import com.gee1216.sentient.overlay.SentientOverlayPackage';
const PACKAGE_ADD_CALL = 'packages.add(SentientOverlayPackage())';

/** Adds the BubbleOverlayService foreground-service declaration to the manifest's <application>. */
function addBubbleServiceToManifest(androidManifest) {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest.application) || manifest.application.length === 0) {
    throw new Error(
      '[with-android-bubble] Unexpected AndroidManifest.xml format — no <application> element found. Update the plugin.',
    );
  }

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

  // Already registered (either the legacy "packages.add(...)" shape, or the
  // new-architecture "PackageList(this).packages.apply { add(...) }" shape).
  if (/\badd\(SentientOverlayPackage\(\)\)/.test(result)) {
    return result;
  }

  if (/val packages = PackageList\(this\)\.packages/.test(result)) {
    // Legacy template: `val packages = PackageList(this).packages` ... `return packages`.
    result = result.replace(
      /(val packages = PackageList\(this\)\.packages)/,
      `$1\n    ${PACKAGE_ADD_CALL}`,
    );
  } else if (/PackageList\(this\)\.packages\.apply \{/.test(result)) {
    // Expo SDK 51+ new-architecture template: packageList is built inline via
    // `PackageList(this).packages.apply { ... }`, so we add() inside that block
    // instead of via a `packages` local variable.
    result = result.replace(
      /(PackageList\(this\)\.packages\.apply \{)/,
      `$1\n          add(SentientOverlayPackage())`,
    );
  } else {
    throw new Error(
      '[with-android-bubble] Unrecognized MainApplication.kt package-list format — update the plugin.',
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
