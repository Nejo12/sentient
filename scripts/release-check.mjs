import { access, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')).expo;
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const failures = [];

function requireValue(value, label) {
  if (!value || (typeof value === 'string' && !value.trim())) failures.push(`${label} is missing`);
}

async function inspectImage(relativePath) {
  const url = new URL(`../${relativePath.replace(/^\.\//, '')}`, import.meta.url);
  const image = sharp(url);
  const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);
  return { metadata, stats };
}

function requireDimensions(metadata, width, height, label) {
  if (metadata.width !== width || metadata.height !== height) {
    failures.push(`${label} must be ${width}x${height}; received ${metadata.width}x${metadata.height}`);
  }
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
    await access(new URL(`../${relativePath.replace(/^\.\//, '')}`, import.meta.url));
  } catch {
    failures.push(`Required release file does not exist: ${relativePath}`);
  }
}

try {
  const icon = await inspectImage(app.icon);
  requireDimensions(icon.metadata, 1024, 1024, 'App icon');
  if (icon.metadata.hasAlpha) failures.push('App icon must be opaque');

  const corner = icon.stats.channels.slice(0, 3).map((channel) => channel.min);
  if (corner[0] > 160 || corner[1] > 100 || corner[2] > 80) {
    failures.push('App icon must use a full-bleed oxblood background without baked rounded corners');
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
