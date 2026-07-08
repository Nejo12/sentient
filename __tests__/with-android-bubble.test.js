const {
  addBubbleServiceToManifest,
  addBubbleServicePermissionsToManifest,
} = require('../plugins/with-android-bubble');

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

  it('throws a clear error if the manifest has no <application> element', () => {
    expect(() => addBubbleServiceToManifest({ manifest: {} })).toThrow(
      '[with-android-bubble] Unexpected AndroidManifest.xml format',
    );
  });
});

describe('addBubbleServicePermissionsToManifest', () => {
  it('adds the FOREGROUND_SERVICE and FOREGROUND_SERVICE_SPECIAL_USE permissions', () => {
    const result = addBubbleServicePermissionsToManifest(baseManifest());
    const permissionNames = result.manifest['uses-permission'].map(
      (item) => item.$['android:name'],
    );

    expect(permissionNames).toContain('android.permission.FOREGROUND_SERVICE');
    expect(permissionNames).toContain('android.permission.FOREGROUND_SERVICE_SPECIAL_USE');
  });

  it('does not duplicate the permissions on a second run', () => {
    const once = addBubbleServicePermissionsToManifest(baseManifest());
    const twice = addBubbleServicePermissionsToManifest(once);

    const permissionNames = twice.manifest['uses-permission'].map(
      (item) => item.$['android:name'],
    );
    expect(permissionNames.filter((name) => name === 'android.permission.FOREGROUND_SERVICE')).toHaveLength(
      1,
    );
    expect(
      permissionNames.filter((name) => name === 'android.permission.FOREGROUND_SERVICE_SPECIAL_USE'),
    ).toHaveLength(1);
  });
});
