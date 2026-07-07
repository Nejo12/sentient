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
