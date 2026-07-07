const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const PLAIN_TEXT = 'public.plain-text';
const UTF8_PLAIN_TEXT = 'public.utf8-plain-text';

const TYPE_DECLARATION = `  let plainTextContentType: String = "${PLAIN_TEXT}"
  let utf8PlainTextContentType: String = "${UTF8_PLAIN_TEXT}"`;

const EXTRA_HANDLERS = `        } else if attachment.hasItemConformingToTypeIdentifier(plainTextContentType) {
          await handleText(
            content: content,
            attachment: attachment,
            index: index,
            typeIdentifier: plainTextContentType
          )
        } else if attachment.hasItemConformingToTypeIdentifier(utf8PlainTextContentType) {
          await handleText(
            content: content,
            attachment: attachment,
            index: index,
            typeIdentifier: utf8PlainTextContentType
          )`;

const HANDLE_TEXT_SIGNATURE =
  '  private func handleText(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async {';
const HANDLE_TEXT_SIGNATURE_WITH_TYPE =
  '  private func handleText(content: NSExtensionItem, attachment: NSItemProvider, index: Int, typeIdentifier: String? = nil) async {';

const LOAD_ITEM_LINE =
  '      if let item = try! await attachment.loadItem(forTypeIdentifier: self.textContentType)';
const LOAD_ITEM_WITH_TYPE = `      let resolvedType = typeIdentifier ?? self.textContentType
      if let item = try! await attachment.loadItem(forTypeIdentifier: resolvedType)`;

/** Patch expo-share-intent's ShareViewController for Messages plain-text UTIs. */
function patchShareViewController(swiftPath) {
  if (!fs.existsSync(swiftPath)) {
    return false;
  }

  let content = fs.readFileSync(swiftPath, 'utf8');

  if (content.includes(PLAIN_TEXT)) {
    return false;
  }

  if (!content.includes('let textContentType: String = UTType.text.identifier')) {
    throw new Error(
      '[with-ios-share-text-fix] Unexpected ShareViewController.swift format — update the plugin.',
    );
  }

  content = content.replace(
    'let textContentType: String = UTType.text.identifier',
    `let textContentType: String = UTType.text.identifier\n${TYPE_DECLARATION}`,
  );

  content = content.replace(
    '} else if attachment.hasItemConformingToTypeIdentifier(textContentType) {',
    `${EXTRA_HANDLERS}\n        } else if attachment.hasItemConformingToTypeIdentifier(textContentType) {`,
  );

  content = content.replace(HANDLE_TEXT_SIGNATURE, HANDLE_TEXT_SIGNATURE_WITH_TYPE);
  content = content.replace(LOAD_ITEM_LINE, LOAD_ITEM_WITH_TYPE);

  fs.writeFileSync(swiftPath, content);
  return true;
}

function withIosShareTextFix(config) {
  // Must run as a `withXcodeProject` mod (not `withDangerousMod`): Expo's mod
  // compiler always runs `dangerous` mods before `xcodeproj` mods regardless
  // of plugin order in app.json (see @expo/config-plugins mod-compiler.js
  // precedences: dangerous -2, xcodeproj -1). expo-share-intent creates
  // ShareExtension/ShareViewController.swift from its own `xcodeproj` mod, so
  // patching it from a `dangerousMod` ran before the file existed and
  // silently no-op'd.
  return withXcodeProject(config, async (configMod) => {
    const swiftPath = path.join(
      configMod.modRequest.platformProjectRoot,
      'ShareExtension',
      'ShareViewController.swift',
    );

    patchShareViewController(swiftPath);
    return configMod;
  });
}

module.exports = withIosShareTextFix;
module.exports.patchShareViewController = patchShareViewController;
