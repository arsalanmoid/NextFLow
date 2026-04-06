import { Handle, Position, useEdges, type NodeProps } from 'reactflow'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import type { ExtractFrameNodeData } from '../../types'

export function ExtractFrameNode({ id, data }: NodeProps<ExtractFrameNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const nodeResults    = useWorkflowStore(s => s.nodeResults)
  const edges          = useEdges()

  const connectedTargets = new Set(edges.filter(e => e.target === id).map(e => e.targetHandle))
  const result = nodeResults[id]

  const preview = result?.status === 'success' && typeof result.output === 'string'
    ? <img src={result.output} alt="frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : data.resultUrl
    ? <img src={data.resultUrl} alt="frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
