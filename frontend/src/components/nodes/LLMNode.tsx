import { Handle, Position, useEdges, type NodeProps } from 'reactflow'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import { useExecute } from '../../hooks/useExecute'
import { GEMINI_MODELS } from '../../types'
import type { LLMNodeData } from '../../types'

export function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const nodeResults    = useWorkflowStore(s => s.nodeResults)
  const edges          = useEdges()
  const { execute } = useExecute()

  const result = nodeResults[id]

  // Check which handles are connected (to grey out manual inputs)
  const connectedTargets = new Set(
    edges.filter(e => e.target === id).map(e => e.targetHandle)
  )

  const preview = result?.status === 'success' && result.output
    ? <div style={{ padding: '10px 12px', fontSize: 12, color: '#e5e7eb', lineHeight: 1.55, maxHeight: 140, overflow: 'auto' }}>
        {String(result.output)}
      </div>
    : result?.status === 'error'
    ? <div style={{ padding: 10, fontSize: 12, color: '#ef4444' }}>{result.error}</div>
    : undefined

  return (
    <NodeCard
      title="Run LLM"
      cuCost={6}
      executionStatus={data.executionStatus}
      previewContent={preview}
    >
      {/* Input handles — left side */}
      <Handle type="target" position={Position.Left} id="system_prompt"
        className="handle-yellow"
        style={{ top: '35%' }}
        title="system_prompt"
      />
      <Handle type="target" position={Position.Left} id="user_message"
        className="handle-yellow"
        style={{ top: '55%' }}
        title="user_message"
      />
      <Handle type="target" position={Position.Left} id="images"
        className="handle-blue"
        style={{ top: '75%' }}
        title="images"
      />

      {/* Output handle — right */}
      <Handle type="source" position={Position.Right} id="output"
        className="handle-blue"
        style={{ top: '50%' }}
      />

      {/* Model dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-blue" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 52 }}>Model</span>
        <select
          value={data.model}
          onChange={e => updateNodeData(id, { model: e.target.value })}
          className="nodrag"
          style={{
            flex: 1, background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#e5e7eb', fontSize: 11, padding: '4px 6px', outline: 'none',
          }}
        >
          {GEMINI_MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* system_prompt label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-yellow" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: connectedTargets.has('system_prompt') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }}>
          System Prompt {connectedTargets.has('system_prompt') ? '(connected)' : '(optional)'}
        </span>
      </div>

      {/* user_message label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-yellow" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: connectedTargets.has('user_message') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }}>
          User Message {connectedTargets.has('user_message') ? '(connected)' : '(required)'}
        </span>
      </div>

      {/* images label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-blue" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          Images (optional)
        </span>
      </div>
    </NodeCard>
  )
}
