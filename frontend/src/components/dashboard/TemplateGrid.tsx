import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { TEMPLATES } from './templates'
import type { Node, Edge } from 'reactflow'

const font = '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif'

function Minimap({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  if (!nodes || nodes.length === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>Empty</div>
  }

  const xs = nodes.map(n => n.position.x)
  const ys = nodes.map(n => n.position.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const nodeW = 140, nodeH = 50
  const rangeX = (maxX - minX + nodeW) || 1
  const rangeY = (maxY - minY + nodeH) || 1
  const pad = 24

  const avail = 100 - pad * 2
  const rects = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const node of nodes) {
    const x = pad + ((node.position.x - minX) / rangeX) * avail
    const y = pad + ((node.position.y - minY) / rangeY) * avail
    const w = Math.max(6, Math.min((nodeW / rangeX) * avail, 28))
    const h = Math.max(4, Math.min((nodeH / rangeY) * avail, 16))
    rects.set(node.id, { x, y, w, h })
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      {edges?.map(edge => {
        const sr = rects.get(edge.source)
        const tr = rects.get(edge.target)
        if (!sr || !tr) return null
        const x1 = sr.x + sr.w / 2, y1 = sr.y + sr.h / 2
        const x2 = tr.x + tr.w / 2, y2 = tr.y + tr.h / 2
        const midY = (y1 + y2) / 2
        return (
          <path key={edge.id} d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`} fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />
        )
      })}
      {Array.from(rects.entries()).map(([id, r]) => (
        <rect key={id} x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill="#404040" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      ))}
    </svg>
  )
}

export function TemplateGrid() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
      {/* Empty Workflow card */}
      <div
        onClick={() => navigate('/workflow/new')}
        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          style={{
            height: 150, borderRadius: 10,
            background: '#262626',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color .2s',
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f6f6f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#262626" />
          </div>
        </div>
        <div style={{ padding: '0 2px' }}>
          <p style={{ fontSize: 16, fontWeight: 400, color: 'oklch(0.985 0 0)', fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif', lineHeight: '24px' }}>Empty Workflow</p>
        </div>
      </div>

      {/* Template cards */}
      {TEMPLATES.map(tpl => (
        <div
          key={tpl.id}
          onClick={() => navigate(`/workflow/new?template=${tpl.id}`)}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            style={{
              height: 150, borderRadius: 10,
              background: '#171717',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color .2s',
              overflow: 'hidden', position: 'relative',
            }}
          >
            <Minimap nodes={tpl.nodes} edges={tpl.edges} />
          </div>
          <div style={{ padding: '0 2px' }}>
            <p style={{ fontSize: 16, fontWeight: 400, color: 'oklch(0.985 0 0)', fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif', lineHeight: '24px', marginBottom: 2 }}>{tpl.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: font, lineHeight: 1.5 }}>{tpl.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
