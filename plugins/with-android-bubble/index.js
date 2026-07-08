const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = '.overlay.BubbleOverlayService';

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

function withAndroidBubble(config) {
  return withAndroidManifest(config, (configMod) => {
    configMod.modResults = addBubbleServiceToManifest(configMod.modResults);
    return configMod;
  });
}

module.exports = withAndroidBubble;
module.exports.addBubbleServiceToManifest = addBubbleServiceToManifest;
