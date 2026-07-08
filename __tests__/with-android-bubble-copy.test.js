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

  it('registers against the Expo SDK 57 new-architecture template (packageList.apply block)', () => {
    const original = `
package com.gee1216.sentient

import android.app.Application

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        }
    )
  }
}
`.trim();

    const patched = registerPackageInMainApplication({ contents: original, language: 'kt' });

    expect(patched).toContain('import com.gee1216.sentient.overlay.SentientOverlayPackage');
    expect(patched).toContain('add(SentientOverlayPackage())');

    const twice = registerPackageInMainApplication({ contents: patched, language: 'kt' });
    expect(twice.match(/add\(SentientOverlayPackage\(\)\)/g)).toHaveLength(1);
  });
});
