const AVATAR_MAX_SIDE = 512
const AVATAR_JPEG_QUALITY = 0.92

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function prepareAvatarDataUrl(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file)
  const img = await loadImage(original)
  const maxSide = Math.max(img.naturalWidth, img.naturalHeight)

  if (!maxSide || maxSide <= AVATAR_MAX_SIDE) {
    return original
  }

  const scale = AVATAR_MAX_SIDE / maxSide
  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return original

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY)
}
