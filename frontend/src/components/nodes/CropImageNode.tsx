import { Handle, Position, useEdges, type NodeProps } from 'reactflow'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import { useExecute } from '../../hooks/useExecute'
import type { CropImageNodeData } from '../../types'

function SliderRow({
  label, value, onChange, connected,
}: { label: string; value: number; onChange: (v: number) => void; connected: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: connected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)', width: 52, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={connected}
        className="nodrag"
        style={{ flex: 1, accentColor: '#a855f7', opacity: connected ? 0.35 : 1 }}
      />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 28, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  )
}

export function CropImageNode({ id, data }: NodeProps<CropImageNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const nodeResults    = useWorkflowStore(s => s.nodeResults)
  const edges          = useEdges()
  const { execute } = useExecute()

  const connectedTargets = new Set(edges.filter(e => e.target === id).map(e => e.targetHandle))
  const result = nodeResults[id]

  const preview = result?.status === 'success' && typeof result.output === 'string'
    ? <img src={result.output} alt="cropped" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : data.resultUrl
    ? <img src={data.resultUrl} alt="cropped" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : undefined

  return (
    <NodeCard title="Crop Image" cuCost={2} executionStatus={data.executionStatus} previewContent={preview}>
      {/* Input handle */}
      <Handle type="target" position={Position.Left} id="image_url"
        className="handle-blue" style={{ top: '50%' }} title="image_url"
      />

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="output"
        className="handle-blue" style={{ top: '50%' }}
      />

      {/* image_url row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-blue" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: connectedTargets.has('image_url') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }}>
          Image {connectedTargets.has('image_url') ? '(connected)' : '(required)'}
        </span>
      </div>

      {/* Sliders */}
      <SliderRow label="X %" value={data.xPercent} onChange={v => updateNodeData(id, { xPercent: v })} connected={connectedTargets.has('x_percent')} />
      <SliderRow label="Y %" value={data.yPercent} onChange={v => updateNodeData(id, { yPercent: v })} connected={connectedTargets.has('y_percent')} />
      <SliderRow label="Width" value={data.widthPercent} onChange={v => updateNodeData(id, { widthPercent: v })} connected={connectedTargets.has('width_percent')} />
      <SliderRow label="Height" value={data.heightPercent} onChange={v => updateNodeData(id, { heightPercent: v })} connected={connectedTargets.has('height_percent')} />
    </NodeCard>
  )
}
