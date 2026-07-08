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

  it('throws a clear error if the manifest has no <application> element', () => {
    expect(() => addBubbleServiceToManifest({ manifest: {} })).toThrow(
      '[with-android-bubble] Unexpected AndroidManifest.xml format',
    );
  });
});
