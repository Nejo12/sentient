import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')).expo;
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const failures = [];
const expectedOxblood = [127, 53, 35];

function requireValue(value, label) {
  if (!value || (typeof value === 'string' && !value.trim())) failures.push(`${label} is missing`);
}

function resolveReleasePath(relativePath) {
  return fileURLToPath(new URL(`../${relativePath.replace(/^\.\//, '')}`, import.meta.url));
}

async function inspectImage(relativePath) {
  const filePath = resolveReleasePath(relativePath);
  const metadata = await sharp(filePath).metadata();
  return { filePath, metadata };
}

async function readPixel(filePath, left, top) {
  const { data, info } = await sharp(filePath)
    .extract({ left, top, width: 1, height: 1 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return Array.from(data.subarray(0, Math.min(3, info.channels)));
}

function requireDimensions(metadata, width, height, label) {
  if (metadata.width !== width || metadata.height !== height) {
    failures.push(`${label} must be ${width}x${height}; received ${metadata.width}x${metadata.height}`);
  }
}

function isCloseToExpectedColor(actual, expected, tolerance = 3) {
  return expected.every((value, index) => Math.abs((actual[index] ?? -255) - value) <= tolerance);
}

requireValue(app.name, 'expo.name');
requireValue(app.slug, 'expo.slug');
requireValue(app.version, 'expo.version');
requireValue(app.scheme, 'expo.scheme');
requireValue(app.ios?.bundleIdentifier, 'expo.ios.bundleIdentifier');
requireValue(app.android?.package, 'expo.android.package');
requireValue(app.extra?.eas?.projectId, 'expo.extra.eas.projectId');

if (app.version !== pkg.version) {
  failures.push(`Version mismatch: app.json=${app.version}, package.json=${pkg.version}`);
}

for (const relativePath of [
  app.icon,
  app.web?.favicon,
  app.android?.adaptiveIcon?.foregroundImage,
  app.android?.adaptiveIcon?.backgroundImage,
  app.android?.adaptiveIcon?.monochromeImage,
  './docs/index.html',
  './docs/privacy.html',
  './docs/support.html',
  './docs/delete-account.html',
]) {
  if (!relativePath) continue;
  try {
    await access(resolveReleasePath(relativePath));
  } catch {
    failures.push(`Required release file does not exist: ${relativePath}`);
  }
}

try {
  const icon = await inspectImage(app.icon);
  requireDimensions(icon.metadata, 1024, 1024, 'App icon');
  if (icon.metadata.hasAlpha) failures.push('App icon must be opaque');

  if (icon.metadata.width && icon.metadata.height) {
    const cornerCoordinates = [
      [0, 0],
      [icon.metadata.width - 1, 0],
      [0, icon.metadata.height - 1],
      [icon.metadata.width - 1, icon.metadata.height - 1],
    ];
    const corners = await Promise.all(
      cornerCoordinates.map(([left, top]) => readPixel(icon.filePath, left, top)),
    );

    if (corners.some((pixel) => !isCloseToExpectedColor(pixel, expectedOxblood))) {
      failures.push('App icon must use a full-bleed oxblood background without baked rounded corners');
    }
  }

  const foreground = await inspectImage(app.android?.adaptiveIcon?.foregroundImage);
  requireDimensions(foreground.metadata, 1024, 1024, 'Android adaptive foreground');
  if (!foreground.metadata.hasAlpha) failures.push('Android adaptive foreground must preserve transparency');

  const monochrome = await inspectImage(app.android?.adaptiveIcon?.monochromeImage);
  requireDimensions(monochrome.metadata, 1024, 1024, 'Android monochrome icon');
  if (!monochrome.metadata.hasAlpha) failures.push('Android monochrome icon must preserve transparency');

  const background = await inspectImage(app.android?.adaptiveIcon?.backgroundImage);
  requireDimensions(background.metadata, 1024, 1024, 'Android adaptive background');
} catch (error) {
  failures.push(`Release image validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

const legalSource = await readFile(new URL('../src/constants/legal.ts', import.meta.url), 'utf8');
for (const requiredUrl of [
  'https://nejo12.github.io/sentient/privacy.html',
  'https://nejo12.github.io/sentient/support.html',
  'https://nejo12.github.io/sentient/delete-account.html',
]) {
  if (!legalSource.includes(requiredUrl)) {
    failures.push(`Legal URL is not configured: ${requiredUrl}`);
  }
}

if (failures.length) {
  console.error('\nRelease configuration failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Release configuration OK: ${app.name} ${app.version}`);
