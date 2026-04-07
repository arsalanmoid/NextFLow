import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactFlow, {
  Background,
  MiniMap,
  type NodeTypes,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow'
import {
  Undo2, Redo2, Plus, MousePointer2,
  Hand, Scissors,
  ChevronDown, Play, Download, FileUp,
  ArrowLeft, Save,
} from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { useWorkflowApi } from '../hooks/useApi'
import { TEMPLATES } from '../components/dashboard/templates'
import { useExecute } from '../hooks/useExecute'
import { PresetSelector } from '../components/canvas/PresetSelector'
import { LeftSidebar } from '../components/sidebar/LeftSidebar'
import { RightSidebar } from '../components/sidebar/RightSidebar'
import { TextNode } from '../components/nodes/TextNode'
import { LLMNode } from '../components/nodes/LLMNode'
import { UploadImageNode } from '../components/nodes/UploadImageNode'
import { UploadVideoNode } from '../components/nodes/UploadVideoNode'
import { CropImageNode } from '../components/nodes/CropImageNode'
import { ExtractFrameNode } from '../components/nodes/ExtractFrameNode'
import type { NodeType } from '../types'

const nodeTypes: NodeTypes = {
  textNode:         TextNode,
  llmNode:          LLMNode,
  uploadImageNode:  UploadImageNode,
  uploadVideoNode:  UploadVideoNode,
  cropImageNode:    CropImageNode,
  extractFrameNode: ExtractFrameNode,
}

type Tool = 'select' | 'pan' | 'cut' | 'connect'

export function WorkflowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNew = id === 'new'

  const [isRenaming, setIsRenaming] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showLogoMenu, setShowLogoMenu] = useState(false)
  const theme = (localStorage.getItem('nf-theme') as 'dark' | 'light') ?? 'dark'
  const isDark = theme === 'dark'
  const nameRef = useRef<HTMLInputElement>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const {
    nodes, edges,
    workflowName, currentWorkflowId,
    activeTool,
    onNodesChange, onEdgesChange, onConnect,
    setWorkflowName, setActiveTool, setWorkflow,
    setNodes, setEdges,
    undo, redo,
    addNode,
  } = useWorkflowStore()

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
    if (activeTool !== 'cut') return
    setEdges(edges.filter(e => e.id !== edge.id))
  }, [activeTool, edges, setEdges])


  const { getWorkflow, createWorkflow, updateWorkflow } = useWorkflowApi()
  const { execute } = useExecute()
  const isRunning = useWorkflowStore(s => s.isRunning)
  const activeUploads = useWorkflowStore(s => s.activeUploads)

  // Close logo menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setShowLogoMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load existing workflow from DB (or reset for new / template)
  useEffect(() => {
    if (isNew || !id) {
      const tplId = searchParams.get('template')
      const tpl = tplId ? TEMPLATES.find(t => t.id === tplId) : null
      setNodes(tpl ? tpl.nodes as any : [])
      setEdges(tpl ? tpl.edges as any : [])
      setWorkflowName(tpl ? tpl.name : 'Untitled')
      useWorkflowStore.setState({ currentWorkflowId: null, runs: [] })
      return
    }
    getWorkflow(id)
      .then(wf => {
        setWorkflow({
          id: wf.id,
          name: wf.name,
          nodes: wf.nodes as any,
          edges: wf.edges as any,
          createdAt: wf.createdAt,
          updatedAt: wf.updatedAt,
          runs: (wf.runs ?? []).map((r: any) => ({
            ...r,
            nodeResults: r.nodeResults as any[],
          })),
        })
      })
      .catch(err => {
        console.error('Failed to load workflow:', err)
        navigate('/dashboard')
      })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (isSaving || nodes.length === 0 || activeUploads > 0) return
    setIsSaving(true)
    try {
      const payload = { name: workflowName, nodes: nodes as any, edges: edges as any }
      if (currentWorkflowId) {
        await updateWorkflow(currentWorkflowId, payload)
      } else {
        const created = await createWorkflow(payload)
        useWorkflowStore.getState().setWorkflow({
          ...created,
          nodes: created.nodes as any,
          edges: created.edges as any,
          runs: [],
        })
        navigate(`/workflow/${created.id}`, { replace: true })
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, nodes, edges, workflowName, currentWorkflowId, activeUploads, updateWorkflow, createWorkflow, navigate])

  const { screenToFlowPosition } = useReactFlow()

  const onPaneDoubleClick = useCallback((e: React.MouseEvent) => {
    if (showPresets) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode('textNode', { x: position.x - 130, y: position.y - 60 })
  }, [addNode, showPresets, screenToFlowPosition])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showPresets) { if (e.key === 'Escape') setShowPresets(false); return }
if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo() }
  }, [addNode, undo, redo, showPresets])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/nextflow-node') as NodeType
    if (!type) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(type, { x: position.x - 130, y: position.y - 60 })
  }, [addNode, screenToFlowPosition])

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ name: workflowName, nodes, edges }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [workflowName, nodes, edges])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (data.nodes) setNodes(data.nodes)
        if (data.edges) setEdges(data.edges)
        if (data.name) setWorkflowName(data.name)
      } catch (err) {
        console.error('Invalid workflow JSON:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [setNodes, setEdges, setWorkflowName])

  const tools: { id: Tool; icon: React.ReactNode; title: string; label: string; shortcut: string }[] = [
    { id: 'select',  icon: <MousePointer2 size={16} />, title: 'Select', label: 'Select', shortcut: 'V' },
    { id: 'pan',     icon: <Hand size={16} />,          title: 'Pan',    label: 'Pan',    shortcut: 'H' },
    { id: 'cut',     icon: <Scissors size={16} />,      title: 'Cut',    label: 'Cut',    shortcut: 'X' },
  ]

  const menuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', fontSize: 13, color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer', borderRadius: 8, transition: 'background 0.1s',
    background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
  }

  return (
    <div
      className="w-full h-full flex outline-none"
      style={{ background: isDark ? '#101010' : '#f0f0f0', overflow: 'hidden' }}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* hidden import input */}
      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* ── Left sidebar ─────────────────────────────────── */}
      <LeftSidebar />

      {/* ── Canvas column (top bar + canvas + bottom bar) ── */}
      <div className="flex-1 relative" style={{ overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar — floats over canvas */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between pb-2 pointer-events-none" style={{ zIndex: 20, padding: '16px 20px 8px 16px' }}>
          {/* LEFT — logo + name pill */}
          <div className="pointer-events-auto relative flex items-center" ref={logoMenuRef}
            style={{ background: '#202020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '6px 8px', gap: 0 }}
          >
            {/* Logo + dropdown arrow — opens menu */}
            <button
              className="flex items-center gap-1.5 rounded-lg cursor-pointer select-none"
              style={{
                padding: '10px 8px 10px 12px', background: 'transparent', border: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setShowLogoMenu(v => !v)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="1" width="22" height="22" rx="5" fill="url(#nf-bg)" />
                <rect x="4" y="4" width="8" height="8" rx="2.5" fill="white" fillOpacity="0.95" />
                <rect x="13" y="13" width="7" height="7" rx="2" fill="white" fillOpacity="0.8" />
                <path d="M10 10C12 12 13 13.5 14.5 14.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.7" />
                <defs>
                  <linearGradient id="nf-bg" x1="1" y1="1" x2="23" y2="23"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#2563eb"/></linearGradient>
                </defs>
              </svg>
              <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.35)', marginTop: 1 }} />
            </button>

            {/* Workflow name — click to rename */}
            {isRenaming ? (
              <input
                ref={nameRef}
                className="bg-transparent outline-none text-sm font-medium text-white"
                style={{
                  padding: '8px 10px 8px 6px', borderRadius: 10, width: 160,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                }}
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                onBlur={() => setIsRenaming(false)}
                onKeyDown={e => { if (e.key === 'Enter') setIsRenaming(false) }}
                autoFocus
              />
            ) : (
              <button
                className="rounded-lg cursor-pointer"
                style={{
                  padding: '8px 10px 8px 6px', background: 'transparent', border: 'none',
                  fontSize: 14, fontWeight: 400, color: '#fff', letterSpacing: '-0.01em',
                  fontFamily: '"Suisse Intl", ui-sans-serif, system-ui, sans-serif',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => { setIsRenaming(true); setTimeout(() => nameRef.current?.select(), 50) }}
              >
                {workflowName}
              </button>
            )}

            {showLogoMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '6px 0', minWidth: 200, zIndex: 100,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <button style={menuItemStyle}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { setShowLogoMenu(false); navigate('/dashboard') }}
                >
                  <ArrowLeft size={15} style={{ color: 'rgba(255,255,255,0.5)' }} /> Back
                </button>
                <button style={menuItemStyle}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { setShowLogoMenu(false); importRef.current?.click() }}
                >
                  <FileUp size={15} style={{ color: 'rgba(255,255,255,0.5)' }} /> Import
                </button>
                <button style={menuItemStyle}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { setShowLogoMenu(false); handleExport() }}
                >
                  <Download size={15} style={{ color: 'rgba(255,255,255,0.5)' }} /> Export
                </button>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0 || activeUploads > 0}
              className="flex items-center gap-2 text-sm font-medium transition-all"
              style={{
                color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '10px 18px', borderRadius: 999,
                background: '#1a1a1a',
                cursor: isSaving || nodes.length === 0 || activeUploads > 0 ? 'not-allowed' : 'pointer',
                opacity: isSaving || nodes.length === 0 ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!isSaving && nodes.length > 0 && activeUploads === 0) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a1a')}
            >
              <Save size={14} /> {isSaving ? 'Saving...' : activeUploads > 0 ? 'Uploading...' : 'Save'}
            </button>
            {nodes.some(n => n.selected) && !isRunning && (
              <button
                onClick={() => execute('PARTIAL', nodes.filter(n => n.selected).map(n => n.id))}
                disabled={activeUploads > 0}
                className="flex items-center gap-2 text-sm font-medium"
                style={{
                  color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)',
                  padding: '10px 18px', borderRadius: 999,
                  background: 'rgba(168,85,247,0.1)', cursor: 'pointer',
                }}
              >
                <Play size={14} /> Run Selected
              </button>
            )}
            <button
              onClick={() => execute('FULL')}
              disabled={isRunning || nodes.length === 0 || activeUploads > 0}
              className={`run-btn${isRunning ? ' run-btn--running' : ''} flex items-center gap-2 text-sm font-medium transition-all`}
              style={{ color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 999 }}
            >
              <Play size={14} /> {isRunning ? 'Running...' : 'Run workflow'}
            </button>
          </div>
        </div>

        {/* Canvas — fills full column */}
        <div
          className={`absolute inset-0${activeTool === 'pan' ? ' tool-pan' : ''}${activeTool === 'cut' ? ' tool-cut' : ''}`}
          style={{ overflow: 'hidden' }}
          ref={reactFlowWrapper}
        >
          <div className="grain-overlay" />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onDoubleClick={onPaneDoubleClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            minZoom={0.1}
            maxZoom={2}
            panOnDrag={activeTool === 'pan' && !showPresets}
            selectionOnDrag={activeTool === 'select' && !showPresets}
            deleteKeyCode={['Delete', 'Backspace']}
            proOptions={{ hideAttribution: true }}
            style={{ background: isDark ? '#101010' : '#f0f0f0' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={isDark ? '#282828' : 'rgba(0,0,0,0.2)'} />
            {nodes.length === 0 && !showPresets && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
                <p className="text-sm font-medium mb-1" style={{ color: isDark ? '#808080' : 'rgba(0,0,0,0.3)' }}>Add a node</p>
                <p className="text-xs" style={{ color: isDark ? '#808080' : 'rgba(0,0,0,0.18)' }}>
                  Double click or right click
                </p>
              </div>
            )}
            <MiniMap position="bottom-right" style={{ bottom: 60, right: 16 }} nodeColor="#2a2a2a" maskColor="rgba(0,0,0,0.4)" />
          </ReactFlow>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end pointer-events-none" style={{ padding: '0 20px 20px 20px' }}>
          <div className="pointer-events-auto flex items-center gap-2" style={{ marginLeft: 4 }}>
            {/* Undo — square with rounded corners */}
            <button
              onClick={undo}
              title="Undo"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
              style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff', cursor: 'pointer', transition: 'background-color 0.25s ease-in-out',
              }}
            >
              <Undo2 size={13} />
            </button>

            {/* Redo — square with rounded corners */}
            <button
              onClick={redo}
              title="Redo"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
              style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff', cursor: 'pointer', transition: 'background-color 0.25s ease-in-out',
              }}
            >
              <Redo2 size={13} />
            </button>

            {/* Keyboard shortcuts — rectangle with rounded corners */}
            <button
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
              style={{
                height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 7,
                backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff', cursor: 'pointer', transition: 'background-color 0.25s ease-in-out',
                fontSize: 12, fontWeight: 400, letterSpacing: '-0.01em',
                fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1, fontFamily: 'system-ui', color: '#fff' }}>⌘</span>
              Keyboard shortcuts
            </button>
          </div>
          <div className="pointer-events-auto relative flex items-center" style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 20,
            background: '#202020', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '7px 14px', gap: 4, display: 'flex',
          }}>
            {/* + button with tooltip */}
            <div style={{ position: 'relative' }}
              onMouseEnter={e => { const t = e.currentTarget.querySelector<HTMLElement>('.plus-tooltip'); if (t) t.style.opacity = '1' }}
              onMouseLeave={e => { const t = e.currentTarget.querySelector<HTMLElement>('.plus-tooltip'); if (t) t.style.opacity = '0' }}
            >
              {/* PresetSelector panel */}
              {showPresets && <PresetSelector onDismiss={() => setShowPresets(false)} />}
              {/* Tooltip */}
              <div className="plus-tooltip" style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                background: '#fff', border: 'none',
                borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 7,
                whiteSpace: 'nowrap', pointerEvents: 'none',
                opacity: 0, transition: 'opacity 0.15s ease',
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif' }}>New Node</span>
              </div>
              <button
                onClick={() => setShowPresets(true)}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'transparent', border: 'none',
                  borderRadius: 9, color: '#fff', cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Tool buttons */}
            {tools.map(t => (
              <div
                key={t.id}
                style={{ position: 'relative' }}
                onMouseEnter={e => { const tip = e.currentTarget.querySelector<HTMLElement>('.tool-tooltip'); if (tip) tip.style.opacity = '1' }}
                onMouseLeave={e => { const tip = e.currentTarget.querySelector<HTMLElement>('.tool-tooltip'); if (tip) tip.style.opacity = '0' }}
              >
                {/* Tooltip */}
                <div className="tool-tooltip" style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                  background: '#fff', border: 'none',
                  borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 7,
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                  opacity: 0, transition: 'opacity 0.15s ease',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif' }}>{t.label}</span>
                </div>
                <button
                  onClick={() => setActiveTool(t.id as Tool)}
                  data-active={activeTool === t.id ? 'true' : 'false'}
                  onMouseEnter={e => { if (e.currentTarget.dataset.active !== 'true') e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (e.currentTarget.dataset.active !== 'true') e.currentTarget.style.backgroundColor = 'transparent' }}
                  style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: activeTool === t.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: 'none', borderRadius: 9,
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {t.icon}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right sidebar ─────────────────────────────────── */}
      <RightSidebar />
    </div>
  )
}
