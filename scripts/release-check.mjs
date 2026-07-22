import { access, readFile } from 'node:fs/promises';

const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')).expo;
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const failures = [];

function requireValue(value, label) {
  if (!value || (typeof value === 'string' && !value.trim())) failures.push(`${label} is missing`);
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
