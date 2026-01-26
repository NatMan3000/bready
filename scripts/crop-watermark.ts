import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join } from 'path'

const IMAGES_DIR = './public/images'
const CROP_BOTTOM = 30 // pixels to crop from bottom

async function cropWatermark() {
  const files = await readdir(IMAGES_DIR)
  const pngFiles = files.filter(f => f.endsWith('.png') && !f.includes('('))

  console.log(`Found ${pngFiles.length} images to process`)

  for (const file of pngFiles) {
    const filePath = join(IMAGES_DIR, file)

    try {
      const image = sharp(filePath)
      const metadata = await image.metadata()

      if (!metadata.width || !metadata.height) {
        console.log(`Skipping ${file} - could not read dimensions`)
        continue
      }

      const newHeight = metadata.height - CROP_BOTTOM

      // Crop from top-left, removing bottom pixels
      const buffer = await image
        .extract({
          left: 0,
          top: 0,
          width: metadata.width,
          height: newHeight
        })
        .toBuffer()

      // Write back to same file
      await sharp(buffer).toFile(filePath)

      console.log(`Cropped ${file}: ${metadata.width}x${metadata.height} -> ${metadata.width}x${newHeight}`)
    } catch (err) {
      console.error(`Error processing ${file}:`, err)
    }
  }

  console.log('Done!')
}

cropWatermark()
