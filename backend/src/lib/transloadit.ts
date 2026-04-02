import crypto from 'crypto'
import path from 'path'
import FormData from 'form-data'

const AUTH_KEY    = process.env.TRANSLOADIT_KEY!
const AUTH_SECRET = process.env.TRANSLOADIT_SECRET!

interface UploadResult {
  url: string
  ssl_url: string
}

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv'])

function buildSteps(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  if (VIDEO_EXTS.has(ext)) {
    return {
      store: { robot: '/video/encode', use: ':original', preset: 'ipad-high' },
    }
  }
  // Images — this was working before
  return {
    store: { robot: '/image/resize', use: ':original' },
  }
}

export async function uploadToTransloadit(
  buffer: Buffer,
  filename: string,
): Promise<UploadResult> {
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const params = JSON.stringify({
    auth: { key: AUTH_KEY, expires },
    steps: buildSteps(filename),
  })

  const signature = crypto
    .createHmac('sha384', AUTH_SECRET)
    .update(params)
    .digest('hex')

  // Use form-data package — correctly sets Content-Length in Node.js
  const form = new FormData()
  form.append('params', params)
  form.append('signature', `sha384:${signature}`)
  form.append('file', buffer, { filename, knownLength: buffer.length })

  // Convert form-data stream to buffer so native fetch can send it correctly
  const formBuffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    form.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    form.on('end', () => resolve(Buffer.concat(chunks)))
    form.on('error', reject)
    form.resume()
  })

  const res = await fetch('https://api2.transloadit.com/assemblies', {
    method: 'POST',
    headers: form.getHeaders(),
    body: formBuffer.buffer.slice(formBuffer.byteOffset, formBuffer.byteOffset + formBuffer.byteLength) as ArrayBuffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Transloadit upload failed (${res.status}): ${text}`)
  }

  const assembly = await res.json()

  if (assembly.ok === 'ASSEMBLY_EXECUTING' || assembly.ok === 'ASSEMBLY_UPLOADING') {
    return pollAssembly(assembly.assembly_ssl_url)
  }

  if (assembly.ok !== 'ASSEMBLY_COMPLETED') {
    throw new Error(`Transloadit assembly error: ${assembly.error ?? assembly.ok}`)
  }

  return extractUrl(assembly)
}

async function pollAssembly(assemblyUrl: string, maxAttempts = 60): Promise<UploadResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(assemblyUrl)
    const data = await res.json()

    if (data.ok === 'ASSEMBLY_COMPLETED') {
      return extractUrl(data)
    }
    if (data.ok === 'REQUEST_ABORTED' || data.error) {
      throw new Error(`Transloadit assembly failed: ${data.error ?? data.ok}`)
    }
  }
  throw new Error('Transloadit assembly timed out')
}

function extractUrl(assembly: any): UploadResult {
  const steps = assembly.results ?? {}
  for (const stepResults of Object.values(steps) as any[]) {
    if (stepResults?.[0]) {
      return {
        url: stepResults[0].url,
        ssl_url: stepResults[0].ssl_url ?? stepResults[0].url,
      }
    }
  }
  if (assembly.uploads?.length > 0) {
    return {
      url: assembly.uploads[0].url,
      ssl_url: assembly.uploads[0].ssl_url ?? assembly.uploads[0].url,
    }
  }
  throw new Error('No output file found in Transloadit assembly results')
}
