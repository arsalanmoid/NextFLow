/**
 * DAG topological sort — returns execution layers.
 * Each layer is an array of node IDs that can run concurrently (all deps satisfied).
 */

interface DagNode { id: string; type: string }
interface DagEdge { source: string; target: string }

export function topoSort(nodes: DagNode[], edges: DagEdge[]): string[][] {
  const inDegree: Record<string, number> = {}
  const adj: Record<string, string[]> = {}

  for (const n of nodes) {
    inDegree[n.id] = 0
    adj[n.id] = []
  }

  for (const e of edges) {
    adj[e.source].push(e.target)
    inDegree[e.target] = (inDegree[e.target] ?? 0) + 1
  }

  const layers: string[][] = []
  let queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)

  while (queue.length > 0) {
    layers.push([...queue])
    const next: string[] = []
    for (const nodeId of queue) {
      for (const tgt of adj[nodeId]) {
        inDegree[tgt]--
        if (inDegree[tgt] === 0) next.push(tgt)
      }
    }
    queue = next
  }

  // Check if all nodes were included (detect cycles)
  const processed = layers.flat().length
  if (processed !== nodes.length) {
    throw new Error(`Cycle detected: only ${processed}/${nodes.length} nodes reachable`)
  }

  return layers
}

/**
 * Given edges and a target node, collect all direct input values.
 * Returns a map of targetHandle → sourceNodeId.
 */
export function getInputSources(
  edges: DagEdge[],
  nodeId: string
): { sourceId: string; sourceHandle: string | null; targetHandle: string | null }[] {
  return edges
    .filter(e => e.target === nodeId)
    .map(e => ({
      sourceId:     e.source,
      sourceHandle: (e as any).sourceHandle ?? null,
      targetHandle: (e as any).targetHandle ?? null,
    }))
}
