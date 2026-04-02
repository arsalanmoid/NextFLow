import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'
import type { NodeChange, EdgeChange, Connection, XYPosition } from 'reactflow'
import type {
  AppNode, AppEdge, NodeType, NodeData,
  NodeResult, WorkflowRun, Workflow,
} from '../types'
import { NODE_DEFAULTS } from '../types'

let _nodeCounter = 1
const genId = () => `node-${_nodeCounter++}`
const genEdgeId = () => `edge-${Math.random().toString(36).slice(2, 9)}`

interface Snapshot { nodes: AppNode[]; edges: AppEdge[] }

interface WorkflowStore {
  // ── Canvas state ──
  nodes: AppNode[]
  edges: AppEdge[]
  currentWorkflowId: string | null
  workflowName: string

  // ── Execution state ──
  executingNodes: Set<string>
  nodeResults: Record<string, NodeResult>
  isRunning: boolean
  currentRunId: string | null
  runs: WorkflowRun[]
  activeUploads: number

  // ── History (undo/redo) ──
  past: Snapshot[]
  future: Snapshot[]

  // ── Active tool ──
  activeTool: 'select' | 'pan' | 'connect' | 'cut'

  // ── Actions ──
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType, position: XYPosition) => void
  updateNodeData: (id: string, data: Partial<NodeData>) => void
  deleteNode: (id: string) => void
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: AppEdge[]) => void
  setWorkflow: (w: Workflow) => void
  setWorkflowName: (name: string) => void
  setActiveTool: (tool: WorkflowStore['activeTool']) => void

  snapshot: () => void
  undo: () => void
  redo: () => void

  // ── Execution actions ──
  setNodeExecuting: (id: string, v: boolean) => void
  setNodeResult: (id: string, result: NodeResult) => void
  setIsRunning: (v: boolean) => void
  setCurrentRunId: (id: string | null) => void
  setRuns: (runs: WorkflowRun[]) => void
  addRun: (run: WorkflowRun) => void
  updateRun: (id: string, patch: Partial<WorkflowRun>) => void
  resetExecution: () => void
  incrementUploads: () => void
  decrementUploads: () => void
}

// ── Cycle detection ──────────────────────────────────────────
function hasCycle(edges: AppEdge[], newSrc: string, newTgt: string): boolean {
  const adj: Record<string, string[]> = {}
  for (const e of edges) {
    if (!adj[e.source]) adj[e.source] = []
    adj[e.source].push(e.target)
  }
  if (!adj[newSrc]) adj[newSrc] = []
  adj[newSrc].push(newTgt)

  const visited = new Set<string>()
  const dfs = (node: string): boolean => {
    if (node === newSrc && visited.size > 0) return true
    if (visited.has(node)) return false
    visited.add(node)
    for (const next of adj[node] ?? []) {
      if (dfs(next)) return true
    }
    return false
  }
  return dfs(newTgt)
}

// ── Type-safe connection check ───────────────────────────────
function isValidConnection(
  nodes: AppNode[],
  connection: Connection
): boolean {
  const srcNode = nodes.find(n => n.id === connection.source)
  const tgtHandle = connection.targetHandle ?? ''
  if (!srcNode) return false

  const srcType = srcNode.type as NodeType
  const isImage = ['uploadImageNode', 'cropImageNode', 'extractFrameNode'].includes(srcType)
  const isVideo = srcType === 'uploadVideoNode'
  const isText  = ['textNode', 'llmNode'].includes(srcType)

  if (isVideo && tgtHandle !== 'video_url') return false
  if (isImage && ['system_prompt','user_message','video_url','timestamp'].includes(tgtHandle)) return false
  if (isText  && ['image_url','video_url'].includes(tgtHandle)) return false

  return true
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  currentWorkflowId: null,
  workflowName: 'Untitled',
  executingNodes: new Set(),
  nodeResults: {},
  isRunning: false,
  currentRunId: null,
  runs: [],
  activeUploads: 0,
  past: [],
  future: [],
  activeTool: 'select',

  snapshot() {
    const { nodes, edges, past } = get()
    set({ past: [...past.slice(-49), { nodes, edges }], future: [] })
  },

  onNodesChange(changes) {
    set(s => ({ nodes: applyNodeChanges(changes, s.nodes) as AppNode[] }))
  },

  onEdgesChange(changes) {
    set(s => ({ edges: applyEdgeChanges(changes, s.edges) }))
  },

  onConnect(connection) {
    const { nodes, edges, snapshot } = get()
    if (hasCycle(edges, connection.source!, connection.target!)) {
      console.warn('Cycle detected — rejected')
      return
    }
    if (!isValidConnection(nodes, connection)) {
      console.warn('Type mismatch — rejected')
      return
    }
    snapshot()
    set(s => ({
      edges: addEdge(
        {
          ...connection,
          id: genEdgeId(),
          animated: false,
          style: { stroke: '#1d4ed8', strokeWidth: 2.5 },
          type: 'default',
        },
        s.edges
      ),
    }))
  },

  addNode(type, position) {
    get().snapshot()
    const id = genId()
    const node: AppNode = {
      id,
      type,
      position,
      data: { ...NODE_DEFAULTS[type] } as NodeData,
    }
    set(s => ({ nodes: [...s.nodes, node] }))
  },

  updateNodeData(id, data) {
    set(s => ({
      nodes: s.nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }))
  },

  deleteNode(id) {
    get().snapshot()
    set(s => ({
      nodes: s.nodes.filter(n => n.id !== id),
      edges: s.edges.filter(e => e.source !== id && e.target !== id),
    }))
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setWorkflow(w) {
    set({
      currentWorkflowId: w.id,
      workflowName: w.name,
      nodes: w.nodes,
      edges: w.edges,
      runs: w.runs ?? [],
      past: [],
      future: [],
    })
  },

  setWorkflowName: (name) => set({ workflowName: name }),
  setActiveTool: (activeTool) => set({ activeTool }),

  undo() {
    const { past, nodes, edges, future } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future.slice(0, 49)],
    })
  },

  redo() {
    const { future, nodes, edges, past } = get()
    if (!future.length) return
    const next = future[0]
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      past: [...past.slice(-49), { nodes, edges }],
    })
  },

  setNodeExecuting(id, v) {
    set(s => {
      const next = new Set(s.executingNodes)
      v ? next.add(id) : next.delete(id)
      return { executingNodes: next }
    })
  },

  setNodeResult(id, result) {
    set(s => ({ nodeResults: { ...s.nodeResults, [id]: result } }))
  },

  setIsRunning: (isRunning) => set({ isRunning }),
  setCurrentRunId: (currentRunId) => set({ currentRunId }),
  setRuns: (runs) => set({ runs }),
  addRun: (run) => set(s => ({ runs: [run, ...s.runs] })),
  updateRun: (id, patch) =>
    set(s => ({
      runs: s.runs.map(r => r.id === id ? { ...r, ...patch } : r),
    })),

  resetExecution() {
    set({ executingNodes: new Set(), nodeResults: {}, isRunning: false, currentRunId: null })
  },
  incrementUploads: () => set(s => ({ activeUploads: s.activeUploads + 1 })),
  decrementUploads: () => set(s => ({ activeUploads: Math.max(0, s.activeUploads - 1) })),
}))
