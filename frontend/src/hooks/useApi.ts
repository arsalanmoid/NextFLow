import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? ''

export function useApi() {
  const { getToken } = useAuth()

  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const token = await getToken()
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers ?? {}),
      },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `Request failed: ${res.status}`)
    }
    return res.json()
  }, [getToken])

  return { apiFetch }
}

// ── Workflow API helpers ─────────────────────────────────────

export interface WorkflowListItem {
  id: string
  name: string
  updatedAt: string
  createdAt: string
  nodes: { id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> }[]
  edges: { id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }[]
}

export function useWorkflowApi() {
  const { apiFetch } = useApi()

  const listWorkflows = useCallback(
    () => apiFetch('/api/workflows') as Promise<WorkflowListItem[]>,
    [apiFetch]
  )

  const getWorkflow = useCallback(
    (id: string) => apiFetch(`/api/workflows/${id}`),
    [apiFetch]
  )

  const createWorkflow = useCallback(
    (data: { name: string; nodes: unknown[]; edges: unknown[] }) =>
      apiFetch('/api/workflows', { method: 'POST', body: JSON.stringify(data) }),
    [apiFetch]
  )

  const updateWorkflow = useCallback(
    (id: string, data: { name: string; nodes: unknown[]; edges: unknown[] }) =>
      apiFetch(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    [apiFetch]
  )

  const deleteWorkflow = useCallback(
    (id: string) => apiFetch(`/api/workflows/${id}`, { method: 'DELETE' }),
    [apiFetch]
  )

  return { listWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow }
}
