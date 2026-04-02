import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { runs } from '@trigger.dev/sdk/v3'
import { topoSort, getInputSources } from '../lib/dag'
import { llmTask } from '../trigger/llm-task'
import { cropImageTask } from '../trigger/crop-image-task'
import { extractFrameTask } from '../trigger/extract-frame-task'

const router = Router()

const ExecuteSchema = z.object({
  workflowId:      z.string(),
  scope:           z.enum(['FULL', 'PARTIAL', 'SINGLE']),
  selectedNodeIds: z.array(z.string()).optional(),
})

// Collects the output value from a node result record
function getNodeOutput(outputs: Record<string, any>, nodeId: string, _handle?: string | null): any {
  const result = outputs[nodeId]
  if (!result) return undefined
  // For text nodes, output is the text data itself
  if (result._type === 'textNode')        return result.text
  if (result._type === 'uploadImageNode') return result.imageUrl
  if (result._type === 'uploadVideoNode') return result.videoUrl
  // For task outputs
  return result.output ?? result
}

// ── POST /api/execute ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const parsed = ExecuteSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const { workflowId, scope, selectedNodeIds } = parsed.data

  try {
    // Load workflow
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: userId! },
    })
    if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return }

    const allNodes = workflow.nodes as any[]
    const allEdges = workflow.edges as any[]

    // Determine which nodes to execute
    let nodesToRun = allNodes
    let edgesToUse = allEdges
    if (scope === 'SINGLE' && selectedNodeIds?.length) {
      nodesToRun = allNodes.filter(n => selectedNodeIds.includes(n.id))
      // Include edges where both source and target are in the selected set
      // Plus edges from upstream nodes (to gather inputs)
      const nodeIds = new Set(selectedNodeIds)
      edgesToUse = allEdges.filter(e => nodeIds.has(e.target))
    } else if (scope === 'PARTIAL' && selectedNodeIds?.length) {
      const nodeIds = new Set(selectedNodeIds)
      nodesToRun = allNodes.filter(n => nodeIds.has(n.id))
      edgesToUse = allEdges.filter(e => nodeIds.has(e.source) || nodeIds.has(e.target))
    }

    // Topological sort
    const layers = topoSort(nodesToRun, edgesToUse.filter(e =>
      nodesToRun.some(n => n.id === e.source) && nodesToRun.some(n => n.id === e.target)
    ))

    // Create run record
    const run = await prisma.workflowRun.create({
      data: {
        workflowId,
        userId: userId!,
        status: 'RUNNING',
        scope,
        nodeResults: [] as any,
      },
    })

    const startTime = Date.now()
    const outputs: Record<string, any> = {}
    const nodeResults: any[] = []

    // Pre-populate outputs for source-only nodes (Text, UploadImage, UploadVideo)
    for (const node of allNodes) {
      if (node.type === 'textNode') {
        outputs[node.id] = { _type: 'textNode', text: node.data?.text ?? '', output: node.data?.text ?? '' }
      } else if (node.type === 'uploadImageNode') {
        outputs[node.id] = { _type: 'uploadImageNode', imageUrl: node.data?.imageUrl, output: node.data?.imageUrl }
      } else if (node.type === 'uploadVideoNode') {
        outputs[node.id] = { _type: 'uploadVideoNode', videoUrl: node.data?.videoUrl, output: node.data?.videoUrl }
      }
    }

    // Execute layer by layer
    for (const layer of layers) {
      await Promise.all(layer.map(async (nodeId) => {
        const node = allNodes.find(n => n.id === nodeId)
        if (!node) return

        const nodeStart = Date.now()
        const inputs = getInputSources(allEdges, nodeId)

        try {
          let result: any = null

          switch (node.type) {
            case 'textNode': {
              // Already pre-populated — record as instant success
              result = { output: node.data?.text ?? '' }
              break
            }

            case 'uploadImageNode': {
              result = { output: node.data?.imageUrl ?? '' }
              break
            }

            case 'uploadVideoNode': {
              result = { output: node.data?.videoUrl ?? '' }
              break
            }

            case 'llmNode': {
              // Gather inputs from connected nodes
              let systemPrompt: string | undefined
              let userMessage = ''
              const imageUrls: string[] = []

              for (const inp of inputs) {
                const val = getNodeOutput(outputs, inp.sourceId, inp.sourceHandle)
                if (!val) continue
                if (inp.targetHandle === 'system_prompt') systemPrompt = String(val)
                else if (inp.targetHandle === 'user_message') userMessage = String(val)
                else if (inp.targetHandle === 'images') {
                  if (typeof val === 'string') imageUrls.push(val)
                }
              }

              const llmHandle = await llmTask.trigger({
                model:        node.data?.model ?? 'gemini-2.0-flash',
                systemPrompt,
                userMessage,
                imageUrls:    imageUrls.length > 0 ? imageUrls : undefined,
              })
              const llmRun = await runs.poll(llmHandle.id, { pollIntervalMs: 1000 })
              if (!llmRun.isSuccess) throw new Error(llmRun.error?.message ?? 'LLM task failed')
              result = (llmRun as any).output
              break
            }

            case 'cropImageNode': {
              let imageUrl = ''
              for (const inp of inputs) {
                const val = getNodeOutput(outputs, inp.sourceId, inp.sourceHandle)
                if (inp.targetHandle === 'image_url' && val) imageUrl = String(val)
              }

              const cropHandle = await cropImageTask.trigger({
                imageUrl,
                xPercent:      node.data?.xPercent ?? 0,
                yPercent:      node.data?.yPercent ?? 0,
                widthPercent:  node.data?.widthPercent ?? 100,
                heightPercent: node.data?.heightPercent ?? 100,
              })
              const cropRun = await runs.poll(cropHandle.id, { pollIntervalMs: 1000 })
              console.log('Crop run output:', JSON.stringify(cropRun.output))
              if (!cropRun.isSuccess) throw new Error((cropRun as any).error?.message ?? 'Crop image task failed')
              result = (cropRun as any).output
              break
            }

            case 'extractFrameNode': {
              let videoUrl = ''
              let timestamp = node.data?.timestamp ?? '0'
              for (const inp of inputs) {
                const val = getNodeOutput(outputs, inp.sourceId, inp.sourceHandle)
                if (inp.targetHandle === 'video_url' && val) videoUrl = String(val)
                if (inp.targetHandle === 'timestamp' && val) timestamp = String(val)
              }

              const frameHandle = await extractFrameTask.trigger({
                videoUrl,
                timestamp,
              })
              const frameRun = await runs.poll(frameHandle.id, { pollIntervalMs: 1000 })
              console.log('Frame run output:', JSON.stringify(frameRun.output))
              if (!frameRun.isSuccess) throw new Error((frameRun as any).error?.message ?? 'Extract frame task failed')
              result = (frameRun as any).output
              break
            }
          }

          outputs[nodeId] = result
          nodeResults.push({
            nodeId,
            nodeType: node.type,
            status: 'success',
            output: result?.output ?? result,
            durationMs: Date.now() - nodeStart,
            startedAt: new Date(nodeStart).toISOString(),
          })
        } catch (err: any) {
          nodeResults.push({
            nodeId,
            nodeType: node.type,
            status: 'error',
            error: err.message ?? 'Unknown error',
            durationMs: Date.now() - nodeStart,
            startedAt: new Date(nodeStart).toISOString(),
          })
        }
      }))
    }

    // Determine final status
    const hasError   = nodeResults.some(r => r.status === 'error')
    const hasSuccess = nodeResults.some(r => r.status === 'success')
    const finalStatus = hasError && hasSuccess ? 'PARTIAL' : hasError ? 'FAILED' : 'SUCCESS'

    // Update run
    const updatedRun = await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status:      finalStatus,
        durationMs:  Date.now() - startTime,
        nodeResults: nodeResults as any,
      },
    })

    res.json(updatedRun)
  } catch (err: any) {
    console.error('Execution error:', err)
    res.status(500).json({ error: err.message ?? 'Execution failed' })
  }
})

export default router
