import type { Node, Edge } from 'reactflow'

// ── Node Types ──────────────────────────────────────────────
export type NodeType =
  | 'textNode'
  | 'uploadImageNode'
  | 'uploadVideoNode'
  | 'llmNode'
  | 'cropImageNode'
  | 'extractFrameNode'

// ── Node Data ───────────────────────────────────────────────
export interface BaseNodeData {
  label?: string
  executionStatus?: 'idle' | 'running' | 'success' | 'error'
  executionError?: string
}

export interface TextNodeData extends BaseNodeData {
  text: string
}

export interface UploadImageNodeData extends BaseNodeData {
  imageUrl?: string
  fileName?: string
}

export interface UploadVideoNodeData extends BaseNodeData {
  videoUrl?: string
  fileName?: string
}

export interface LLMNodeData extends BaseNodeData {
  model: string
  result?: string
}

export interface CropImageNodeData extends BaseNodeData {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  resultUrl?: string
}

export interface ExtractFrameNodeData extends BaseNodeData {
  timestamp: string
  resultUrl?: string
}

export type NodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData

export type AppNode = Node<NodeData>
export type AppEdge = Edge

// ── Execution ────────────────────────────────────────────────
export interface NodeResult {
  nodeId: string
  nodeType: NodeType
  status: 'success' | 'error' | 'running'
  output?: unknown
  error?: string
  durationMs?: number
  startedAt: string
}

export type RunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL'
export type RunScope  = 'FULL' | 'PARTIAL' | 'SINGLE'

export interface WorkflowRun {
  id: string
  workflowId: string
  status: RunStatus
  scope: RunScope
  selectedNodeIds?: string[]
  durationMs?: number
  nodeResults: NodeResult[]
  createdAt: string
}

// ── Workflow ─────────────────────────────────────────────────
export interface Workflow {
  id: string
  name: string
  nodes: AppNode[]
  edges: AppEdge[]
  createdAt: string
  updatedAt: string
  runs?: WorkflowRun[]
}

// ── Gemini Models ────────────────────────────────────────────
export const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash',      label: 'gemini-2.5-flash' },
  { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
  { value: 'gemini-2.0-flash',      label: 'gemini-2.0-flash' },
] as const

// ── Node default data ────────────────────────────────────────
export const NODE_DEFAULTS: Record<NodeType, NodeData> = {
  textNode:         { text: '' },
  uploadImageNode:  {},
  uploadVideoNode:  {},
  llmNode:          { model: 'gemini-2.5-flash-lite' },
  cropImageNode:    { xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 },
  extractFrameNode: { timestamp: '0' },
}
