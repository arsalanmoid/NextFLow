import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth'
import { uploadToTransloadit } from '../lib/transloadit'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }) // 100 MB

// POST /api/upload — upload a file to Transloadit, return CDN URL
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
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
