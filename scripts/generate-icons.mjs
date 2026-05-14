import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svgRaw = readFileSync(join(root, 'public', 'favicon.svg'))

const sizes = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of sizes) {
  const padding = Math.round(size * 0.15)
  const inner = size - padding * 2
  const resized = await sharp(svgRaw)
    .resize(inner, inner, { fit: 'contain', background: '#fcf9f4' })
    .png()
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: '#fcf9f4' }
  })
    .composite([{ input: resized, top: padding, left: padding }])
    .png()
    .toFile(join(root, 'public', file))
  console.log(`✓ ${file} (${size}x${size})`)
}
