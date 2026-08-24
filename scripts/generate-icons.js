/**
 * Generates PWA + iOS icons from an inline SVG "sunflower" mark.
 * Run with: npm run icons
 *
 * NOTE: these are placeholder brand icons. Replace them with final art when
 * available (keep the same filenames + sizes).
 */
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const CREAM = '#FDF8F4'
const TERRACOTTA = '#D85A30'
const PEACH = '#F0997B'
const DARK = '#4A1B0C'

// Full-bleed background version (for maskable + apple-touch, which should not
// have transparent corners). `padding` leaves room for maskable safe zone.
function markSvg(size, { rounded = false, padding = 0 } = {}) {
  const c = size / 2
  const scale = (size * (1 - padding)) / 64
  const radius = rounded ? size * 0.22 : 0
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${CREAM}"/>
  <g transform="translate(${c} ${c}) scale(${scale})">
    <g fill="${PEACH}">
      ${Array.from({ length: 8 })
        .map(
          (_, i) =>
            `<ellipse cx="0" cy="-19" rx="4.6" ry="9" transform="rotate(${i * 45})"/>`
        )
        .join('\n      ')}
    </g>
    <circle r="11" fill="${TERRACOTTA}"/>
    <circle r="5.5" fill="${DARK}"/>
  </g>
</svg>`
}

async function render(name, size, opts) {
  const svg = Buffer.from(markSvg(size, opts))
  await sharp(svg).png().toFile(join(outDir, name))
  // eslint-disable-next-line no-console
  console.log('wrote', name)
}

await render('icon-192.png', 192, { rounded: false })
await render('icon-512.png', 512, { rounded: false })
// Maskable needs padding so the mark survives circular/rounded masks.
await render('icon-maskable-512.png', 512, { rounded: false, padding: 0.2 })
// iOS home-screen icon (Apple applies its own rounding).
await render('apple-touch-icon.png', 180, { rounded: false })

// eslint-disable-next-line no-console
console.log('Done. Icons written to public/icons/')
