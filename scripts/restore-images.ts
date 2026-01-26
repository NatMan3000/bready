import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join } from 'path'

const SOURCE_DIR = './public/images/Resized'
const DEST_DIR = './public/images'
const TARGET_WIDTH = 854

async function restoreImages() {
  const files = await readdir(SOURCE_DIR)
  // Get only the main images (not the "(Small)" variants)
  const pngFiles = files.filter(f => f.endsWith('.png') && !f.includes('(Small)'))

  console.log(`Found ${pngFiles.length} images to restore`)

  for (const file of pngFiles) {
    const sourcePath = join(SOURCE_DIR, file)
    const destPath = join(DEST_DIR, file)

    try {
      const image = sharp(sourcePath)
      const metadata = await image.metadata()

      if (!metadata.width || !metadata.height) {
        console.log(`Skipping ${file} - could not read dimensions`)
        continue
      }

      // Calculate new height maintaining aspect ratio
      const aspectRatio = metadata.height / metadata.width
      const targetHeight = Math.round(TARGET_WIDTH * aspectRatio)

      await image
        .resize(TARGET_WIDTH, targetHeight)
        .toFile(destPath)

      console.log(`Restored ${file}: ${metadata.width}x${metadata.height} -> ${TARGET_WIDTH}x${targetHeight}`)
    } catch (err) {
      console.error(`Error processing ${file}:`, err)
    }
  }

  console.log('Done!')
}

restoreImages()
