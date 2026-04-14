import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, useEdges, type NodeProps } from 'reactflow'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { NodeCard } from './NodeCard'
import { useWorkflowStore } from '../../store/workflowStore'
import { GEMINI_MODELS } from '../../types'
import type { LLMNodeData } from '../../types'

export function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const updateNodeData = useWorkflowStore(s => s.updateNodeData)
  const nodeResults    = useWorkflowStore(s => s.nodeResults)
  const edges          = useEdges()
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const result = nodeResults[id]

  const connectedTargets = new Set(
    edges.filter(e => e.target === id).map(e => e.targetHandle)
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = GEMINI_MODELS.find(m => m.value === data.model) ?? GEMINI_MODELS[0]

  const outputText = result?.status === 'success' && result.output ? String(result.output) : null

  const handleCopy = () => {
    if (!outputText) return
    navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const preview = outputText
    ? <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{ padding: '10px 12px', fontSize: 12, color: '#e5e7eb', lineHeight: 1.55, height: '100%', overflowY: 'auto' }}>
          {outputText}
        </div>
        <button
          className="nodrag"
          onClick={handleCopy}
          title="Copy output"
          style={{
            position: 'absolute', top: 6, right: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: '#2a2a2a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e5e7eb',
            fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
    : result?.status === 'error'
    ? <div style={{ padding: 10, fontSize: 12, color: '#ef4444' }}>{result.error}</div>
    : undefined

  return (
    <NodeCard
      nodeId={id}
      title="Run LLM"
      cuCost={6}
      executionStatus={data.executionStatus}
      previewContent={preview}
    >
      {/* Input handles — left side */}
      <Handle type="target" position={Position.Left} id="system_prompt"
        className="handle-yellow" style={{ top: '35%' }} title="system_prompt"
      />
      <Handle type="target" position={Position.Left} id="user_message"
        className="handle-yellow" style={{ top: '55%' }} title="user_message"
      />
      <Handle type="target" position={Position.Left} id="images"
        className="handle-blue" style={{ top: '75%' }} title="images"
      />

      {/* Output handle — right */}
      <Handle type="source" position={Position.Right} id="output"
        className="handle-blue" style={{ top: '50%' }}
      />

      {/* Model dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="handle-blue" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 52, flexShrink: 0 }}>Model</span>
        <div ref={dropdownRef} className="nodrag" style={{ flex: 1, position: 'relative' }}>
          {/* Trigger */}
          <button
            ref={triggerRef}
            onClick={() => {
              if (!open && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect()
                setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
              }
              setOpen(v => !v)
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: '#e5e7eb', fontSize: 11, padding: '4px 8px',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <span>{selected.label}</span>
            <ChevronDown size={11} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {/* Options list — rendered via portal to escape card overflow:hidden */}
          {open && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
                zIndex: 9999, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              {GEMINI_MODELS.map(m => (
                <button
                  key={m.value}
                  onClick={() => { updateNodeData(id, { model: m.value }); setOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '7px 10px',
                    fontSize: 11, color: m.value === data.model ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: m.value === data.model ? 'rgba(168,85,247,0.15)' : 'transparent',
                    border: 'none', cursor: 'pointer', display: 'block',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (m.value !== data.model) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (m.value !== data.model) e.currentTarget.style.background = 'transparent' }}
                >
                  {m.label}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
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
