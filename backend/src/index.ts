import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerk } from './middleware/auth'
import workflowRoutes from './routes/workflows'
import runRoutes from './routes/runs'
import executeRoutes from './routes/execute'
import uploadRoutes from './routes/upload'

const app  = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: true,
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))

// Clerk auth on all routes
app.use(clerk)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

// Routes
app.use('/api/workflows', workflowRoutes)
app.use('/api/runs',      runRoutes)
app.use('/api/execute',   executeRoutes)
app.use('/api/upload',    uploadRoutes)

app.listen(PORT, () => {
  console.log(`NextFlow backend running on http://localhost:${PORT}`)
})
