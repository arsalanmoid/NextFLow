import { useRef } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { ImageIcon, Upload, Loader2 } from 'lucide-react'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import { useUpload } from '../../hooks/useUpload'
import type { UploadImageNodeData } from '../../types'

export function UploadImageNode({ id, data }: NodeProps<UploadImageNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useUpload()

  const handleFile = async (file: File) => {
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    updateNodeData(id, { imageUrl: localUrl, fileName: file.name })

    // Upload to Transloadit for a persistent CDN URL
    try {
      const cdnUrl = await upload(file)
      updateNodeData(id, { imageUrl: cdnUrl })
    } catch (err: any) {
      console.error('Image upload failed:', err)
      updateNodeData(id, { fileName: `⚠ Upload failed: ${err.message}` })
    }
  }

  const preview = data.imageUrl
    ? <img
        src={data.imageUrl}
        alt="preview"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    : undefined

  return (
    <NodeCard title="Upload Image" cuCost={1} previewContent={preview}>
      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="image_url"
        className="handle-blue" style={{ top: '50%' }}
      />

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="nodrag"
        style={{
          width: '100%', padding: '8px 0', borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px dashed rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {uploading ? (
          <><Loader2 size={13} className="animate-spin" /> Uploading...</>
        ) : data.fileName ? (
          <><ImageIcon size={13} /> {data.fileName}</>
        ) : (
          <><Upload size={13} /> Click to upload image</>
        )}
      </button>

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
        jpg · jpeg · png · webp · gif
      </p>
    </NodeCard>
  )
}
