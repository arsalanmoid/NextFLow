import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useWorkflowStore } from '../store/workflowStore'
import type { RunScope } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? ''

function parseSSE(text: string): { event: string; data: string }[] {
  const events: { event: string; data: string }[] = []
  const blocks = text.split('\n\n')
  for (const block of blocks) {
    if (!block.trim()) continue
    let event = ''
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7)
      else if (line.startsWith('data: ')) data = line.slice(6)
    }
    if (event && data) events.push({ event, data })
  }
  return events
}

export function useExecute() {
  const { getToken } = useAuth()
  const store = useWorkflowStore

  const execute = useCallback(async (
    scope: RunScope,
    selectedNodeIds?: string[],
  ) => {
    const { currentWorkflowId, setNodeExecuting, setIsRunning, setNodeResult, addRun, updateNodeData } = store.getState()
    if (!currentWorkflowId) {
      console.warn('Save the workflow before running')
      return
    }

    setIsRunning(true)

    try {
      const token = await getToken()
      const res = await fetch(`${BASE}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workflowId: currentWorkflowId,
          scope,
          selectedNodeIds,
        }),
      })

      if (!res.body) {
        throw new Error(`Execute failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Only process complete events (ending with \n\n)
        const lastDoubleNewline = buffer.lastIndexOf('\n\n')
        if (lastDoubleNewline === -1) continue

        const complete = buffer.slice(0, lastDoubleNewline + 2)
        buffer = buffer.slice(lastDoubleNewline + 2)

        const events = parseSSE(complete)

        for (const { event, data } of events) {
          try {
            const parsed = JSON.parse(data)

            switch (event) {
              case 'layer:start': {
                for (const nodeId of parsed.nodeIds) {
                  setNodeExecuting(nodeId, true)
                  updateNodeData(nodeId, { executionStatus: 'running' } as any)
                }
                break
              }

              case 'node:done': {
                setNodeExecuting(parsed.nodeId, false)
                setNodeResult(parsed.nodeId, parsed)
                updateNodeData(parsed.nodeId, {
                  executionStatus: parsed.status === 'success' ? 'success' : 'error',
                } as any)
                break
              }

              case 'run:done': {
                addRun({
                  id: parsed.id,
                  workflowId: parsed.workflowId,
                  status: parsed.status,
                  scope: parsed.scope,
                  durationMs: parsed.durationMs,
                  nodeResults: parsed.nodeResults,
                  createdAt: parsed.createdAt,
                })
                break
              }

              case 'error': {
                console.error('Execution error from server:', parsed.error)
                break
              }
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    } catch (err: any) {
      console.error('Execution failed:', err)
    } finally {
      setIsRunning(false)
    }
  }, [getToken])

  return { execute }
}
