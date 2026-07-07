const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { patchShareViewController } = require('../plugins/with-ios-share-text-fix');
const templatePath = path.join(
  __dirname,
  '../node_modules/expo-share-intent/plugin/build/ios/ShareExtensionViewController.swift',
);

describe('with-ios-share-text-fix plugin', () => {
  it('patches ShareViewController to accept plain-text UTIs', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentient-share-fix-'));
    const shareDir = path.join(tempDir, 'ShareExtension');
    fs.mkdirSync(shareDir, { recursive: true });
    fs.copyFileSync(templatePath, path.join(shareDir, 'ShareViewController.swift'));

    patchShareViewController(path.join(shareDir, 'ShareViewController.swift'));

    const patched = fs.readFileSync(path.join(shareDir, 'ShareViewController.swift'), 'utf8');

    expect(patched).toContain('public.plain-text');
    expect(patched).toContain('typeIdentifier: String? = nil');
    expect(patched).toContain('let resolvedType = typeIdentifier ?? self.textContentType');
  });
});
