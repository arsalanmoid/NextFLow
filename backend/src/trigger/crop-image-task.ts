import { task } from '@trigger.dev/sdk/v3'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { uploadToTransloadit } from '../lib/transloadit'

interface CropImageInput {
  imageUrl: string
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
}

export const cropImageTask = task({
  id: 'crop-image',
  retry: { maxAttempts: 2 },
  run: async (payload: CropImageInput) => {
    const dir = mkdtempSync(join(tmpdir(), 'nf-crop-'))
    const inputPath  = join(dir, 'input.jpg')
    const outputPath = join(dir, 'output.jpg')

    try {
      // Download image
      const res = await fetch(payload.imageUrl)
      if (!res.ok) throw new Error(`Failed to download image: ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      writeFileSync(inputPath, buffer)

      // Get image dimensions via FFmpeg
      const ffprobe = process.env.FFPROBE_PATH ?? 'ffprobe'
      const ffmpeg  = process.env.FFMPEG_PATH  ?? 'ffmpeg'
      const probeOut = execSync(
        `"${ffprobe}" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputPath}"`,
        { encoding: 'utf-8' }
      ).trim()
      const [imgW, imgH] = probeOut.split('x').map(Number)

      // Calculate pixel crop
      const x = Math.round((payload.xPercent / 100) * imgW)
      const y = Math.round((payload.yPercent / 100) * imgH)
      const w = Math.round((payload.widthPercent / 100) * imgW)
      const h = Math.round((payload.heightPercent / 100) * imgH)

      // FFmpeg crop
      execSync(
        `"${ffmpeg}" -y -i "${inputPath}" -vf "crop=${w}:${h}:${x}:${y}" "${outputPath}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )

      // Upload cropped image to Transloadit
      const cropped = readFileSync(outputPath)
      const result = await uploadToTransloadit(cropped, 'cropped.jpg')

      return { output: result.ssl_url }
    } finally {
      // Cleanup
      try { unlinkSync(inputPath) } catch {}
      try { unlinkSync(outputPath) } catch {}
    }
  },
})
