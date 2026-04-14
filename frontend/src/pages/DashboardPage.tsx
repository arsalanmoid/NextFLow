import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { Search, ChevronDown, EyeOff, Eye, ArrowRight, Plus, Check, MoreVertical, ExternalLink, Pencil, Copy, Trash2 } from 'lucide-react'
import { useWorkflowApi, type WorkflowListItem } from '../hooks/useApi'
import { TemplateGrid } from '../components/dashboard/TemplateGrid'

function WorkflowMinimap({ nodes, edges }: Pick<WorkflowListItem, 'nodes' | 'edges'>) {
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
        <rect key={id} x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill="#3a3a3a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      ))}
    </svg>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

type Tab = 'Projects' | 'Templates'
type SortBy = 'Last viewed' | 'Date created' | 'Alphabetical'
type OrderBy = 'Newest first' | 'Oldest first' | 'A-Z' | 'Z-A'

export function DashboardPage() {
  const navigate  = useNavigate()
  const [tab, setTab]       = useState<Tab>('Projects')
  const [search, setSearch] = useState('')
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [sortBy, setSortBy]   = useState<SortBy>('Last viewed')
  const [orderBy, setOrderBy] = useState<OrderBy>('Newest first')
  const [showSort, setShowSort] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const contextRef = useRef<HTMLDivElement>(null)

  const { listWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowApi()

  useEffect(() => {
    listWorkflows()
      .then(setWorkflows)
      .catch(err => console.error('Failed to load workflows:', err))
      .finally(() => setLoading(false))
  }, [listWorkflows])

  // Close sort dropdown and context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false)
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) setContextMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSortBy = (s: SortBy) => {
    setSortBy(s)
    if (s === 'Alphabetical') setOrderBy('A-Z')
    else setOrderBy('Newest first')
  }

  const filtered = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase())
    const isEmpty = !w.nodes || w.nodes.length === 0
    return matchesSearch && (showEmpty ? true : !isEmpty)
  }).sort((a, b) => {
    if (sortBy === 'Alphabetical') {
      const cmp = a.name.localeCompare(b.name)
      return orderBy === 'Z-A' ? -cmp : cmp
    }
    const cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    return orderBy === 'Oldest first' ? -cmp : cmp
  })

  const openNew = () => navigate('/workflow/new')

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return
    try {
      await deleteWorkflow(id)
      setWorkflows(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleDuplicate = async (wf: WorkflowListItem) => {
    try {
      const full = await getWorkflow(wf.id)
      const created = await createWorkflow({ name: `${wf.name} (copy)`, nodes: full.nodes || [], edges: full.edges || [] })
      setWorkflows(prev => [created, ...prev])
    } catch (err) {
      console.error('Duplicate failed:', err)
    }
  }

  const handleRenameSubmit = async (id: string) => {
    const trimmed = renameValue.trim()
    if (!trimmed) { setRenamingId(null); return }
    try {
      const full = await getWorkflow(id)
      await updateWorkflow(id, { name: trimmed, nodes: full.nodes || [], edges: full.edges || [] })
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, name: trimmed } : w))
    } catch (err) {
      console.error('Rename failed:', err)
    }
    setRenamingId(null)
  }

  const font = '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif'

  return (
    <div style={{ width: '100vw', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', background: '#0c0c0c', color: '#e5e7eb', fontFamily: font, position: 'relative', scrollBehavior: 'smooth' }}>

      {/* Background gradient glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '10%', width: 600, height: 600, background: '#6b21a8', opacity: 0.08, borderRadius: '50%', filter: 'blur(150px)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500, background: '#1d4ed8', opacity: 0.06, borderRadius: '50%', filter: 'blur(140px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '30%', width: 400, height: 400, background: '#ea580c', opacity: 0.04, borderRadius: '50%', filter: 'blur(120px)' }} />
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>N</div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#fff', fontFamily: font }}>NextFlow</span>
        </div>
        <UserButton
          afterSignOutUrl="/dashboard"
          appearance={{
            elements: {
              userButtonPopoverCard: {
                background: '#000',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                width: '220px',
                padding: '4px',
              },
              userButtonPopoverMain: {
                background: '#000',
              },
              userButtonPopoverFooter: {
                display: 'none',
              },
              userPreviewMainIdentifier: {
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 500,
                fontSize: '13px',
              },
              userPreviewSecondaryIdentifier: {
                color: 'rgba(255,255,255,0.4)',
                fontSize: '11px',
              },
              userButtonPopoverActionButton: {
                color: 'rgba(255,255,255,0.8) !important',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '7px',
                margin: '2px 4px',
                padding: '8px 10px',
                '&:hover': {
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8) !important',
                },
              },
              userButtonPopoverActionButtonIcon: {
                color: 'rgba(255,255,255,0.5) !important',
              },
              userButtonPopoverActionButton__signOut: {
                color: '#ef4444 !important',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                '&:hover': {
                  background: 'rgba(239,68,68,0.12)',
                  color: '#ef4444 !important',
                },
              },
              userButtonPopoverActionButtonIcon__signOut: {
                color: '#ef4444 !important',
              },
            },
          }}
        />
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: 460, overflow: 'hidden', background: '#0c0c0c', backgroundImage: 'url(https://s.krea.ai/nodesHeaderBannerBlurGradient.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

        <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '0 32px 110px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <img src="https://www.krea.ai/api/img?f=webp&i=https%3A%2F%2Fs.krea.ai%2Ficons%2FNodeEditor.png&s=256" alt="Node Editor" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <span style={{ fontSize: 28, fontWeight: 400, color: '#fff', fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif' }}>Node Editor</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 400, color: 'oklch(0.985 0 0)', maxWidth: 420, lineHeight: '24px', marginBottom: 56, fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif' }}>
            Nodes is the most powerful way to operate NextFlow.<br />
            Connect every tool and model into complex automated pipelines.
          </p>
          <button
            onClick={openNew}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, background: '#fff', color: '#111', fontWeight: 500, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'opacity .15s', fontFamily: font }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            New Workflow <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Second section (tabs + grid) ─────────────────── */}
      <div style={{ position: 'relative', background: 'radial-gradient(ellipse 80% 40% at 20% 0%, rgba(200,200,210,0.07) 0%, rgba(255,255,255,0.03) 40%, transparent 70%), #0c0c0c' }}>
        {/* Left-to-right illumination overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(180,180,190,0.02) 40%, transparent 75%)', zIndex: 0 }} />

      {/* ── Tabs + toolbar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '44px 28px 16px',
        position: 'relative',
      }}>
        {/* Border line spanning from tabs to eye icon */}
        <div style={{
          position: 'absolute', bottom: 0, left: 28, right: 28,
          height: 1, background: 'rgba(255,255,255,0.15)',
        }} />
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(['Projects', 'Templates'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              onMouseEnter={e => { if (tab !== t) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
              onMouseLeave={e => { if (tab !== t) { e.currentTarget.style.background = 'transparent' } }}
              style={{
                padding: '8px 20px', fontSize: 14, fontWeight: 500,
                background: tab === t ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: tab === t ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                borderRadius: 10, cursor: 'pointer',
                color: '#fff',
                transition: 'color .2s ease, background .2s ease',
                fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif', letterSpacing: '0.01em',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Right toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div
            onFocusCapture={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.border = '1px solid rgba(255,255,255,0.15)'
              el.style.background = '#202020'
              el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.06), 0 0 14px 2px rgba(255,255,255,0.04)'
            }}
            onBlurCapture={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.border = '1px solid rgba(255,255,255,0.08)'
              el.style.background = '#202020'
              el.style.boxShadow = 'none'
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8,
              background: '#202020',
              border: '1px solid rgba(255,255,255,0.08)',
              minWidth: 200,
              transition: 'border-color .3s ease, background .3s ease, box-shadow .4s ease',
            }}>
            <Search size={14} color="rgba(255,255,255,0.3)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e5e7eb', width: '100%', fontFamily: font }}
            />
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSort(v => !v)}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#202020')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8,
                background: '#202020',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 13, fontWeight: 500, color: '#e5e7eb',
                cursor: 'pointer', transition: 'border-color .15s', fontFamily: font,
                whiteSpace: 'nowrap',
              }}
            >
              {sortBy} <ChevronDown size={12} />
            </button>

            {showSort && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '4px 0', zIndex: 100,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {/* Sort by */}
                <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', padding: '6px 12px 3px', fontFamily: font }}>Sort by</p>
                {(['Last viewed', 'Date created', 'Alphabetical'] as SortBy[]).map(s => (
                  <button
                    key={s}
                    onClick={() => handleSortBy(s)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 12px', background: 'transparent', border: 'none',
                      cursor: 'pointer', fontSize: 12, fontWeight: sortBy === s ? 500 : 400, color: '#e5e7eb',
                      fontFamily: font, transition: 'background 0.1s',
                    }}
                  >
                    {s}
                    {sortBy === s && <Check size={14} color="#fff" />}
                  </button>
                ))}

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />

                {/* Order by */}
                <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', padding: '3px 12px 3px', fontFamily: font }}>Order by</p>
                {(sortBy === 'Alphabetical' ? ['A-Z', 'Z-A'] as OrderBy[] : ['Newest first', 'Oldest first'] as OrderBy[]).map(o => (
                  <button
                    key={o}
                    onClick={() => setOrderBy(o)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 12px', background: 'transparent', border: 'none',
                      cursor: 'pointer', fontSize: 12, fontWeight: orderBy === o ? 500 : 400, color: '#e5e7eb',
                      fontFamily: font, transition: 'background 0.1s',
                    }}
                  >
                    {o}
                    {orderBy === o && <Check size={14} color="#fff" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Visibility toggle */}
          <button
            onClick={() => setShowEmpty(v => !v)}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = showEmpty ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.22)')}
            style={{
              padding: '8px 9px', borderRadius: 8,
              background: '#202020',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: showEmpty ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center',
              transition: 'border-color .15s, background .15s, color .15s',
            }}
          >
            {showEmpty ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>

      {/* ── Workflow grid ──────────────────────────────────── */}
      <div style={{ padding: '28px 28px 48px' }}>
        {tab === 'Templates' ? (
          <TemplateGrid />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontFamily: font }}>Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <img src="https://www.krea.ai/api/img?f=webp&i=https%3A%2F%2Fs.krea.ai%2Ficons%2FNodeEditor.png&s=256" alt="Node Editor" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 20 }} />
            <p style={{ fontSize: 20, fontWeight: 400, color: 'oklch(0.985 0 0)', fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif', lineHeight: '24px', marginBottom: 10 }}>No Workflows Yet</p>
            <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif', textAlign: 'center', lineHeight: 1.6 }}>
              You haven't created any workflows yet.<br />
              Get started by creating your first one.
            </p>
            <button
              onClick={openNew}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              style={{
                marginTop: 24, padding: '10px 28px', borderRadius: 999,
                background: '#fff', color: '#111', fontWeight: 500, fontSize: 14,
                border: 'none', cursor: 'pointer', transition: 'opacity .15s', fontFamily: font,
              }}
            >
              New Workflow
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>

            {/* New Workflow card */}
            <div
              onClick={openNew}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Thumbnail container */}
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
              {/* Text below */}
              <div style={{ padding: '0 2px' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: font, letterSpacing: '-0.01em' }}>New Workflow</p>
              </div>
            </div>

            {/* Existing cards */}
            {filtered.map(wf => (
              <div
                key={wf.id}
                onClick={() => { if (!contextMenu && !renamingId) navigate(`/workflow/${wf.id}`) }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {/* Thumbnail container */}
                <div
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#333333'; (e.currentTarget.querySelector('.ctx-btn') as HTMLElement)?.style.setProperty('opacity', '1') }}
                  onMouseLeave={e => { if (contextMenu !== wf.id) { e.currentTarget.style.borderColor = '#1e1e1e'; (e.currentTarget.querySelector('.ctx-btn') as HTMLElement)?.style.setProperty('opacity', '0') } }}
                  style={{
                    height: 150, borderRadius: 10,
                    background: '#141414',
                    border: '1px solid #1e1e1e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    transition: 'border-color .2s',
                  }}
                >
                  {/* Workflow minimap */}
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <WorkflowMinimap nodes={wf.nodes} edges={wf.edges} />
                  </div>
                  {/* Three-dot button */}
                  <div
                    className="ctx-btn"
                    onClick={e => { e.stopPropagation(); setContextMenu(contextMenu === wf.id ? null : wf.id) }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 28, height: 28, borderRadius: 6,
                      background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', opacity: contextMenu === wf.id ? 1 : 0, transition: 'opacity .2s',
                    }}
                  >
                    <MoreVertical size={14} color="rgba(255,255,255,0.7)" />
                  </div>

                  {/* Context menu dropdown */}
                  {contextMenu === wf.id && (
                    <div
                      ref={contextRef}
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', top: 40, right: 0,
                        width: 140, background: '#000', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '4px 4px', zIndex: 100,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      }}
                    >
                      {([
                        { label: 'Open', icon: <ExternalLink size={13} />, color: 'rgba(255,255,255,0.8)', action: () => { setContextMenu(null); navigate(`/workflow/${wf.id}`) } },
                        { label: 'Rename', icon: <Pencil size={13} />, color: 'rgba(255,255,255,0.8)', action: () => { setContextMenu(null); setRenamingId(wf.id); setRenameValue(wf.name) } },
                        { label: 'Duplicate', icon: <Copy size={13} />, color: 'rgba(255,255,255,0.8)', action: () => { setContextMenu(null); handleDuplicate(wf) } },
                      ] as const).map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px', background: 'transparent', border: 'none',
                            borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: item.color,
                            fontFamily: font, transition: 'background 0.15s',
                          }}
                        >
                          <span style={{ color: item.color, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '3px 0' }} />
                      <button
                        onClick={() => { setContextMenu(null); handleDelete(wf.id) }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', background: 'transparent', border: 'none',
                          borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#ef4444',
                          fontFamily: font, transition: 'background 0.15s',
                        }}
                      >
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Text below container */}
                <div style={{ padding: '0 2px' }}>
                  {renamingId === wf.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(wf.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(wf.id); if (e.key === 'Escape') setRenamingId(null) }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: font, letterSpacing: '-0.01em',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
                        outline: 'none', padding: '2px 4px', width: '100%', marginBottom: 3,
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: 16, fontWeight: 400, color: 'oklch(0.985 0 0)', fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', lineHeight: '24px', marginBottom: 3 }}>{wf.name}</p>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)', fontFamily: font }}>Edited {timeAgo(wf.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
