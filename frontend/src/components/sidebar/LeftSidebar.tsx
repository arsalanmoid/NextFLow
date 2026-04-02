import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Search,
  Type, Image, Video, Brain, Crop, Film,
} from 'lucide-react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { NodeType } from '../../types'

const font = '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif'

type Category = { label: string; items: typeof NODE_ITEMS }

const NODE_ITEMS: { type: NodeType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: 'textNode',         label: 'Text',          icon: <Type size={14} />,   description: 'Text input / prompt',  color: '#a78bfa' },
  { type: 'llmNode',          label: 'Run LLM',       icon: <Brain size={14} />,  description: 'Gemini text/vision',   color: '#60a5fa' },
  { type: 'uploadImageNode',  label: 'Upload Image',  icon: <Image size={14} />,  description: 'Upload jpg/png/webp',  color: '#34d399' },
  { type: 'cropImageNode',    label: 'Crop Image',    icon: <Crop size={14} />,   description: 'Crop via FFmpeg',      color: '#34d399' },
  { type: 'uploadVideoNode',  label: 'Upload Video',  icon: <Video size={14} />,  description: 'Upload mp4/mov/webm',  color: '#f472b6' },
  { type: 'extractFrameNode', label: 'Extract Frame', icon: <Film size={14} />,   description: 'Frame from video',     color: '#f472b6' },
]

const CATEGORIES: Category[] = [
  { label: 'Text & AI',  items: NODE_ITEMS.filter(n => ['textNode', 'llmNode'].includes(n.type)) },
  { label: 'Image',      items: NODE_ITEMS.filter(n => ['uploadImageNode', 'cropImageNode'].includes(n.type)) },
  { label: 'Video',      items: NODE_ITEMS.filter(n => ['uploadVideoNode', 'extractFrameNode'].includes(n.type)) },
]

export function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch]       = useState('')
  const addNode = useWorkflowStore(s => s.addNode)

  const isSearching = search.trim().length > 0
  const filtered = NODE_ITEMS.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleClick = (type: NodeType) => {
    addNode(type, { x: 280 + Math.random() * 160, y: 160 + Math.random() * 200 })
  }

  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('application/nextflow-node', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className="sidebar-transition"
      style={{
        width: collapsed ? 36 : 220,
        minWidth: collapsed ? 36 : 220,
        background: '#0c0c0c',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {collapsed ? (
        <div style={{ padding: '10px 6px' }}>
          <button
            onClick={() => setCollapsed(false)}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: 'rgba(255,255,255,0.5)', padding: '3px 5px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              transition: 'background 0.2s ease',
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setCollapsed(true)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, color: 'rgba(255,255,255,0.5)', padding: '3px 5px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <ChevronLeft size={13} />
            </button>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', fontFamily: font }}>
              Nodes
            </p>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 8px 6px' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '6px 9px',
                transition: 'border-color .2s, box-shadow .2s',
              }}
              onFocusCapture={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(255,255,255,0.2)'
                el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.04)'
              }}
              onBlurCapture={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.boxShadow = 'none'
              }}
            >
              <Search size={11} color="rgba(255,255,255,0.3)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search nodes..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 12, color: '#e5e7eb', width: '100%', fontFamily: font,
                }}
              />
            </div>
          </div>

          {/* Node list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 8px' }}>
            {isSearching ? (
              filtered.map(item => (
                <NodeItem key={item.type} item={item} onClick={handleClick} onDragStart={handleDragStart} />
              ))
            ) : (
              CATEGORIES.map(cat => (
                <div key={cat.label} style={{ marginBottom: 10 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    padding: '6px 8px 4px', fontFamily: font,
                  }}>
                    {cat.label}
                  </p>
                  {cat.items.map(item => (
                    <NodeItem key={item.type} item={item} onClick={handleClick} onDragStart={handleDragStart} />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function NodeItem({
  item,
  onClick,
  onDragStart,
}: {
  item: typeof NODE_ITEMS[number]
  onClick: (type: NodeType) => void
  onDragStart: (e: React.DragEvent, type: NodeType) => void
}) {
  return (
    <div
      draggable
      onClick={() => onClick(item.type)}
      onDragStart={e => onDragStart(e, item.type)}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 8px', borderRadius: 8, marginBottom: 1,
        cursor: 'grab', userSelect: 'none',
        background: 'transparent',
        border: '1px solid transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `${item.color}15`,
        border: `1px solid ${item.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: item.color,
      }}>
        {item.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', fontFamily: font, lineHeight: 1.3 }}>{item.label}</p>
        <p style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: font, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</p>
      </div>
    </div>
  )
}
