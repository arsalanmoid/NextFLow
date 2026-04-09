import { Router } from 'express'
import multer from 'multer'
import { getAuth } from '@clerk/express'
import { uploadToTransloadit } from '../lib/transloadit'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }) // 500 MB

// POST /api/upload — upload a file to Transloadit, return CDN URL
// Auth is checked early via header before multer reads the full body,
// so the Clerk token doesn't expire during large uploads.
router.post('/', (req, res, next) => {
  const { userId } = getAuth(req)
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }
  next()
}, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const result = await uploadToTransloadit(req.file.buffer, req.file.originalname)
    res.json({ url: result.ssl_url })
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message ?? 'Upload failed' })
  }
})

export default router
