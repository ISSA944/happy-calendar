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
  await sharp(svgRaw)
    .resize(size, size, { fit: 'contain', background: '#fcf9f4' })
    .png()
    .toFile(join(root, 'public', file))
  console.log(`✓ ${file} (${size}x${size})`)
}
