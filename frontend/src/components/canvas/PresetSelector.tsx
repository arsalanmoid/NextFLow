import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { NodeType } from '../../types'

interface NodeItem {
  type: NodeType
  label: string
  category: string
}

const NODE_ITEMS: NodeItem[] = [
  { type: 'textNode',         label: 'Text',           category: 'Text & LLM' },
  { type: 'llmNode',          label: 'LLM',            category: 'Text & LLM' },
  { type: 'uploadImageNode',  label: 'Upload Image',   category: 'Image' },
  { type: 'cropImageNode',    label: 'Crop Image',     category: 'Image' },
  { type: 'uploadVideoNode',  label: 'Upload Video',   category: 'Video' },
  { type: 'extractFrameNode', label: 'Extract Frame',  category: 'Video' },
]

interface Props {
  onDismiss: () => void
}

export function PresetSelector({ onDismiss }: Props) {
  const [query, setQuery] = useState('')
  const { addNode } = useWorkflowStore()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onDismiss])

  const filtered = query.trim()
    ? NODE_ITEMS.filter(n => n.label.toLowerCase().includes(query.toLowerCase()) || n.category.toLowerCase().includes(query.toLowerCase()))
    : NODE_ITEMS

  const categories = Array.from(new Set(filtered.map(n => n.category)))

  const handleAdd = (type: NodeType) => {
    addNode(type, { x: 300 + Math.random() * 200, y: 200 + Math.random() * 100 })
    onDismiss()
  }

  return (
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%',
      transform: 'translateX(-50%)', zIndex: 100,
    }}>
      <div
        ref={ref}
        style={{
          width: 220,
          background: '#0b0b0b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <Search size={14} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: '#e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif',
            }}
          />
        </div>

        {/* Node list */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '6px 6px' }}>
          {categories.length === 0 ? (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '16px 16px', textAlign: 'center' }}>No results</p>
          ) : categories.map(cat => (
            <div key={cat}>
              {/* Category header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px 4px',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif',
                }}>{cat}</span>
              </div>

              {/* Items */}
              {filtered.filter(n => n.category === cat).map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAdd(node.type)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 10px', background: 'transparent', border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 400, color: '#e5e7eb',
                    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif',
                  }}>{node.label}</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>›</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
