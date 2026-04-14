import { Handle, Position, useEdges, type NodeProps } from 'reactflow'
import { ExternalLink } from 'lucide-react'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import type { ExtractFrameNodeData } from '../../types'

export function ExtractFrameNode({ id, data }: NodeProps<ExtractFrameNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const nodeResults    = useWorkflowStore(s => s.nodeResults)
  const edges          = useEdges()

  const connectedTargets = new Set(edges.filter(e => e.target === id).map(e => e.targetHandle))
  const result = nodeResults[id]

  const imageUrl = (result?.status === 'success' && typeof result.output === 'string')
    ? result.output
    : data.resultUrl ?? null

  const preview = imageUrl
    ? <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img src={imageUrl} alt="frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="nodrag"
          title="Open full size"
          style={{
            position: 'absolute', top: 6, right: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: '#2a2a2a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e5e7eb',
            fontSize: 11, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#333333')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2a2a2a')}
        >
          <ExternalLink size={11} /> Open
        </a>
      </div>
    : undefined

  return (
    <NodeCard nodeId={id} title="Extract Frame" cuCost={2} executionStatus={data.executionStatus} previewContent={preview}>
      {/* Input handle */}
      <Handle type="target" position={Position.Left} id="video_url"
        className="handle-blue" style={{ top: '50%' }} title="video_url"
      />

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="output"
        className="handle-blue" style={{ top: '50%' }}
      />

      {/* video_url row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-blue" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: connectedTargets.has('video_url') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }}>
          Video {connectedTargets.has('video_url') ? '(connected)' : '(required)'}
        </span>
      </div>

      {/* Timestamp input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-blue" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 62, flexShrink: 0 }}>Timestamp</span>
        <input
          type="text"
          value={data.timestamp}
          onChange={e => updateNodeData(id, { timestamp: e.target.value })}
          disabled={connectedTargets.has('timestamp')}
          placeholder="0 or 50%"
          className="nodrag"
          style={{
            flex: 1, background: '#2a2a2a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, color: '#e5e7eb', fontSize: 11,
            padding: '4px 8px', outline: 'none',
            opacity: connectedTargets.has('timestamp') ? 0.35 : 1,
          }}
        />
      </div>

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
        Seconds (e.g. 5) or percentage (e.g. 50%)
      </p>
    </NodeCard>
  )
}
