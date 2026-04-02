import { useRef } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Video, Upload, Loader2 } from 'lucide-react'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import { useUpload } from '../../hooks/useUpload'
import type { UploadVideoNodeData } from '../../types'

export function UploadVideoNode({ id, data }: NodeProps<UploadVideoNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useUpload()

  const handleFile = async (file: File) => {
    const localUrl = URL.createObjectURL(file)
    updateNodeData(id, { videoUrl: localUrl, fileName: file.name })

    try {
      const cdnUrl = await upload(file)
      updateNodeData(id, { videoUrl: cdnUrl })
    } catch (err: any) {
      console.error('Video upload failed:', err)
      updateNodeData(id, { fileName: `⚠ Upload failed: ${err.message}` })
    }
  }

  const preview = data.videoUrl
    ? <video
        src={data.videoUrl}
        controls
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    : undefined

  return (
    <NodeCard title="Upload Video" cuCost={1} previewContent={preview}>
      {/* Output handle — green for video */}
      <Handle type="source" position={Position.Right} id="video_url"
        className="handle-green" style={{ top: '50%' }}
      />

      <input
        ref={inputRef}
        type="file"
        accept=".mp4,.mov,.webm,.m4v"
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
          <><Video size={13} /> {data.fileName}</>
        ) : (
          <><Upload size={13} /> Click to upload video</>
        )}
      </button>

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
        mp4 · mov · webm · m4v
      </p>
    </NodeCard>
  )
}
