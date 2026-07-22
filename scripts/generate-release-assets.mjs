import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = path.join(root, 'assets', 'images');
const brandSource = path.join(root, 'assets', 'brand', 'sentient-mark.svg');
const warmPaper = '#F5EFE6';
const oxblood = '#7F3523';

await mkdir(outputDir, { recursive: true });

const source = await readFile(brandSource, 'utf8');
const fullBleedIconSource = Buffer.from(
  source.replace(
    '<rect width="1024" height="1024" rx="284" fill="#7F3523"/>',
    '<rect width="1024" height="1024" fill="#7F3523"/>',
  ),
);
const roundedBrandSource = Buffer.from(source);

async function writePng(name, pipeline) {
  const target = path.join(outputDir, name);
  await pipeline.png({ compressionLevel: 9, adaptiveFiltering: false }).toFile(target);
  console.log(`Generated ${path.relative(root, target)}`);
}

await writePng(
  'icon.png',
  sharp(fullBleedIconSource, { density: 1024 }).resize(1024, 1024).flatten({ background: oxblood }),
);

await writePng(
  'splash-icon.png',
  sharp(roundedBrandSource, { density: 1024 }).resize(512, 512).extend({
    top: 256,
    bottom: 256,
    left: 256,
    right: 256,
    background: warmPaper,
  }),
);

const foregroundSvg = Buffer.from(`
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <path d="M292 390C344 318 417 282 512 282C607 282 680 318 732 390" stroke="${oxblood}" stroke-width="92" stroke-linecap="round" fill="none"/>
  <path d="M292 634C344 706 417 742 512 742C607 742 680 706 732 634" stroke="${oxblood}" stroke-width="92" stroke-linecap="round" fill="none"/>
  <circle cx="512" cy="512" r="44" fill="${oxblood}"/>
</svg>`);

await writePng(
  'android-icon-foreground.png',
  sharp(foregroundSvg).resize(640, 640).extend({
    top: 192,
    bottom: 192,
    left: 192,
    right: 192,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }),
);

await writePng(
  'android-icon-background.png',
  sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: warmPaper,
    },
  }),
);

const monochromeSvg = Buffer.from(`
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <path d="M292 390C344 318 417 282 512 282C607 282 680 318 732 390" stroke="#FFFFFF" stroke-width="92" stroke-linecap="round" fill="none"/>
  <path d="M292 634C344 706 417 742 512 742C607 742 680 706 732 634" stroke="#FFFFFF" stroke-width="92" stroke-linecap="round" fill="none"/>
  <circle cx="512" cy="512" r="44" fill="#FFFFFF"/>
</svg>`);

await writePng(
  'android-icon-monochrome.png',
  sharp(monochromeSvg).resize(640, 640).extend({
    top: 192,
    bottom: 192,
    left: 192,
    right: 192,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }),
);

await writePng(
  'favicon.png',
  sharp(roundedBrandSource, { density: 256 }).resize(256, 256).flatten({ background: warmPaper }),
);
