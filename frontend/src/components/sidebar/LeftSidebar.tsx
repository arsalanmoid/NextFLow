import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, Type, Image, Video, Brain, Crop, Film } from 'lucide-react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { NodeType } from '../../types'

const font = '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif'

const NODE_ITEMS: { type: NodeType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: 'textNode',         label: 'Text',          icon: <Type size={15} />,   description: 'Text input / prompt',  color: '#a78bfa' },
  { type: 'llmNode',          label: 'Run LLM',       icon: <Brain size={15} />,  description: 'Gemini text/vision',   color: '#60a5fa' },
  { type: 'uploadImageNode',  label: 'Upload Image',  icon: <Image size={15} />,  description: 'Upload jpg/png/webp',  color: '#34d399' },
  { type: 'cropImageNode',    label: 'Crop Image',    icon: <Crop size={15} />,   description: 'Crop via FFmpeg',      color: '#34d399' },
  { type: 'uploadVideoNode',  label: 'Upload Video',  icon: <Video size={15} />,  description: 'Upload mp4/mov/webm',  color: '#f472b6' },
  { type: 'extractFrameNode', label: 'Extract Frame', icon: <Film size={15} />,   description: 'Frame from video',     color: '#f472b6' },
]

const CATEGORIES = [
  { label: 'Text & AI',  items: NODE_ITEMS.filter(n => ['textNode', 'llmNode'].includes(n.type)) },
  { label: 'Image',      items: NODE_ITEMS.filter(n => ['uploadImageNode', 'cropImageNode'].includes(n.type)) },
  { label: 'Video',      items: NODE_ITEMS.filter(n => ['uploadVideoNode', 'extractFrameNode'].includes(n.type)) },
]

const MIN_WIDTH = 52
const MAX_WIDTH = 280
const EXPANDED_THRESHOLD = 100  // below this, show icons only

export function LeftSidebar() {
  const [width, setWidth] = useState(MIN_WIDTH)
  const [search, setSearch] = useState('')
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)
  const addNode = useWorkflowStore(s => s.addNode)

  const isExpanded = width > EXPANDED_THRESHOLD

  const handleClick = (type: NodeType) => {
    addNode(type, { x: 280 + Math.random() * 160, y: 160 + Math.random() * 200 })
  }

  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('application/nextflow-node', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta))
      setWidth(next)
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width])

  const isSearching = search.trim().length > 0
  const filtered = NODE_ITEMS.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      style={{
        width,
        minWidth: width,
        background: '#0c0c0c',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {isExpanded ? (
        <>
          {/* Header */}
          <div style={{ padding: '14px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
      ) : (
        /* Icon-only strip — mirrors expanded layout vertically */
        <>
          {/* Header placeholder — same height as expanded header */}
          <div style={{ padding: '14px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: font }}>&nbsp;</p>
          </div>

          {/* Search placeholder — same height as expanded search */}
          <div style={{ padding: '8px 8px 6px' }}>
            <div style={{ padding: '6px 9px', borderRadius: 8 }}>
              <div style={{ height: 16 }} />
            </div>
          </div>

          {/* Node icons — same structure as expanded categories */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 8px' }}>
            {CATEGORIES.map(cat => (
              <div key={cat.label} style={{ marginBottom: 10 }}>
                {/* Category label placeholder — same height */}
                <div style={{ padding: '6px 8px 4px', height: 20 }} />
                {cat.items.map(item => (
                  <CollapsedIcon key={item.type} item={item} onClick={handleClick} onDragStart={handleDragStart} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute', top: 0, right: 0, width: 4, height: '100%',
          cursor: 'col-resize', zIndex: 20,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />
    </div>
  )
}

function NodeItem({
  item, onClick, onDragStart,
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
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: font, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</p>
      </div>
    </div>
  )
}

function CollapsedIcon({
  item, onClick, onDragStart,
}: {
  item: typeof NODE_ITEMS[number]
  onClick: (type: NodeType) => void
  onDragStart: (e: React.DragEvent, type: NodeType) => void
}) {
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      draggable
      onClick={() => onClick(item.type)}
      onDragStart={e => onDragStart(e, item.type)}
      onMouseEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect()
          setTip({ top: r.top + r.height / 2, left: r.right + 10 })
        }
      }}
      onMouseLeave={() => setTip(null)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '7px 0', marginBottom: 1,
        cursor: 'grab', userSelect: 'none',
      }}
    >
      <div
        style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${item.color}15`,
          border: `1px solid ${item.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: item.color,
        }}
      >
        {item.icon}
      </div>
      {tip && createPortal(
        <div style={{
          position: 'fixed', top: tip.top, left: tip.left,
          transform: 'translateY(-50%)',
          background: '#fff',
          borderRadius: 8, padding: '5px 10px',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#111', fontFamily: font }}>{item.label}</span>
        </div>,
        document.body
      )}
    </div>
  )
}
