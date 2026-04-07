import { Handle, Position, type NodeProps } from 'reactflow'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import type { TextNodeData } from '../../types'

export function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)

  const textArea = (
    <textarea
      value={data.text}
      onChange={e => updateNodeData(id, { text: e.target.value })}
      placeholder="Enter text..."
      className="nodrag"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        border: 'none',
        color: '#e5e7eb',
        fontSize: 12,
        padding: '10px 12px',
        resize: 'none',
        outline: 'none',
        fontFamily: 'inherit',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    />
  )

  return (
    <NodeCard title="Text" cuCost={0} previewContent={textArea} previewHeight={220} cardWidth={200}>
      {/* Output handle — right side, blue */}
      <Handle
        type="source"
        position={Position.Right}
        id="text_out"
        className="handle-blue"
        style={{ top: '50%' }}
      />
    </NodeCard>
  )
}
