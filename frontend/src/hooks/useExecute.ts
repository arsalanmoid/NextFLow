import { useCallback } from 'react'
import { useApi } from './useApi'
import { useWorkflowStore } from '../store/workflowStore'
import type { RunScope, NodeResult, WorkflowRun } from '../types'

export function useExecute() {
  const { apiFetch } = useApi()
  const store = useWorkflowStore

  const execute = useCallback(async (
    scope: RunScope,
    selectedNodeIds?: string[],
  ) => {
    const { currentWorkflowId, nodes, setNodeExecuting, setIsRunning, setNodeResult, addRun, updateNodeData } = store.getState()
    if (!currentWorkflowId) {
      console.warn('Save the workflow before running')
      return
    }

    // Mark all target nodes as executing
    setIsRunning(true)
    const targetIds = scope === 'FULL'
      ? nodes.map(n => n.id)
      : (selectedNodeIds ?? [])
    for (const id of targetIds) {
      setNodeExecuting(id, true)
      updateNodeData(id, { executionStatus: 'running' } as any)
    }

    try {
      const run = await apiFetch('/api/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: currentWorkflowId,
          scope,
          selectedNodeIds,
        }),
      }) as WorkflowRun & { nodeResults: NodeResult[] }

      // Update each node with its result
      for (const nr of run.nodeResults) {
        setNodeExecuting(nr.nodeId, false)
        setNodeResult(nr.nodeId, nr)
        updateNodeData(nr.nodeId, {
          executionStatus: nr.status === 'success' ? 'success' : 'error',
        } as any)
      }

      // Add run to history
      addRun({
        id: run.id,
        workflowId: run.workflowId,
        status: run.status,
        scope: run.scope,
        durationMs: run.durationMs,
        nodeResults: run.nodeResults,
        createdAt: run.createdAt,
      })
    } catch (err: any) {
      console.error('Execution failed:', err)
      for (const id of targetIds) {
        setNodeExecuting(id, false)
        updateNodeData(id, { executionStatus: 'error' } as any)
      }
    } finally {
      setIsRunning(false)
    }
  }, [apiFetch])

  return { execute }
}
