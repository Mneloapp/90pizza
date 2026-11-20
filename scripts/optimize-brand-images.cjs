const path = require('node:path');
const sharp = require('sharp');

const images = path.join(__dirname, '..', 'public', 'images', 'brand');
const specs = [
  ['hero-mobile', [600, 900]],
  ['hero-desktop-v2', [1536]],
  ...['pepperoni', 'margherita', 'four-cheese', 'mushroom', 'spicy', 'veggie']
    .map((name) => [name, [360, 540, 720]]),
];

async function main() {
  for (const [name, widths] of specs) {
    for (const width of widths) {
      const result = await sharp(path.join(images, `${name}.webp`))
        .resize({ width, withoutEnlargement: true })
        .avif({ quality: 54, effort: 6, chromaSubsampling: '4:2:0' })
        .toFile(path.join(images, `${name}-${width}.avif`));
      console.log(`${name}-${width}.avif: ${result.width}x${result.height}, ${result.size} bytes`);
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
