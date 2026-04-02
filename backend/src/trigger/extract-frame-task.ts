import { task } from '@trigger.dev/sdk/v3'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { uploadToTransloadit } from '../lib/transloadit'

interface ExtractFrameInput {
  videoUrl: string
  timestamp: string  // seconds (e.g. "5") or percentage (e.g. "50%")
}

export const extractFrameTask = task({
  id: 'extract-frame',
  retry: { maxAttempts: 2 },
  run: async (payload: ExtractFrameInput) => {
    const dir = mkdtempSync(join(tmpdir(), 'nf-frame-'))
    const inputPath  = join(dir, 'input.mp4')
    const outputPath = join(dir, 'frame.jpg')

    try {
      // Download video
      const res = await fetch(payload.videoUrl)
      if (!res.ok) throw new Error(`Failed to download video: ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      writeFileSync(inputPath, buffer)

      // Resolve timestamp
      const ffprobe = process.env.FFPROBE_PATH ?? 'ffprobe'
      const ffmpeg  = process.env.FFMPEG_PATH  ?? 'ffmpeg'
      let seekSec: number
      if (payload.timestamp.includes('%')) {
        // Get video duration
        const durationStr = execSync(
          `"${ffprobe}" -v error -show_entries format=duration -of csv=p=0 "${inputPath}"`,
          { encoding: 'utf-8' }
        ).trim()
        const duration = parseFloat(durationStr)
        const pct = parseFloat(payload.timestamp.replace('%', ''))
        seekSec = (pct / 100) * duration
      } else {
        seekSec = parseFloat(payload.timestamp) || 0
      }

      // FFmpeg extract frame
      execSync(
        `"${ffmpeg}" -y -ss ${seekSec} -i "${inputPath}" -frames:v 1 -q:v 2 "${outputPath}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )

      // Upload extracted frame to Transloadit
      const frame = readFileSync(outputPath)
      const result = await uploadToTransloadit(frame, 'frame.jpg')

      return { output: result.ssl_url }
    } finally {
      try { unlinkSync(inputPath) } catch {}
      try { unlinkSync(outputPath) } catch {}
    }
  },
})
