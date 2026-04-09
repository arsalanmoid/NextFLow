import { useCallback, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useWorkflowStore } from '../store/workflowStore'

const BASE = import.meta.env.VITE_API_URL ?? ''

export function useUpload() {
  const { getToken } = useAuth()
  const [uploading, setUploading] = useState(false)
  const incrementUploads = useWorkflowStore(s => s.incrementUploads)
  const decrementUploads = useWorkflowStore(s => s.decrementUploads)

  const upload = useCallback(async (file: File): Promise<string> => {
    setUploading(true)
    incrementUploads()
    try {
      // Force a fresh token so it doesn't expire during large uploads
      const token = await getToken({ skipCache: true })
      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`${BASE}/api/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Upload failed: ${res.status}`)
      }

      const data = await res.json()
      return data.url as string
    } finally {
      setUploading(false)
      decrementUploads()
    }
  }, [getToken, incrementUploads, decrementUploads])

  return { upload, uploading }
}
