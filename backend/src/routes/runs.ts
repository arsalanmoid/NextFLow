import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

const NodeResultSchema = z.object({
  nodeId:     z.string(),
  nodeType:   z.string(),
  status:     z.enum(['success', 'error', 'running']),
  output:     z.unknown().optional(),
  error:      z.string().optional(),
  durationMs: z.number().optional(),
  startedAt:  z.string(),
})

const CreateRunSchema = z.object({
  workflowId:      z.string(),
  status:          z.enum(['RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL']),
  scope:           z.enum(['FULL', 'PARTIAL', 'SINGLE']),
  durationMs:      z.number().optional(),
  nodeResults:     z.array(NodeResultSchema),
  selectedNodeIds: z.array(z.string()).optional(),
})

// ── GET /api/runs?workflowId=xxx ─────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const workflowId = String(req.query.workflowId ?? '')
  if (!workflowId) {
    res.status(400).json({ error: 'workflowId required' })
    return
  }
  try {
    const runs = await prisma.workflowRun.findMany({
      where:   { workflowId, userId: userId! },
      orderBy: { createdAt: 'desc' },
      take:    50,
    })
    res.json(runs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch runs' })
  }
})

// ── POST /api/runs — create a run entry ──────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const parsed = CreateRunSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  try {
    const run = await prisma.workflowRun.create({
      data: {
        workflowId:  parsed.data.workflowId,
        userId:      userId!,
        status:      parsed.data.status,
        scope:       parsed.data.scope,
        durationMs:  parsed.data.durationMs,
        nodeResults: parsed.data.nodeResults as any,
      },
    })
    res.status(201).json(run)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create run' })
  }
})

// ── PATCH /api/runs/:id — update run status ───────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const id = String(req.params.id)
  const PatchSchema = z.object({
    status:      z.enum(['RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL']).optional(),
    durationMs:  z.number().optional(),
    nodeResults: z.array(NodeResultSchema).optional(),
  })
  const parsed = PatchSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  try {
    const existing = await prisma.workflowRun.findFirst({
      where: { id, userId: userId! },
    })
    if (!existing) { res.status(404).json({ error: 'Not found' }); return }

    const run = await prisma.workflowRun.update({
      where: { id },
      data: {
        ...(parsed.data.status      && { status:      parsed.data.status }),
        ...(parsed.data.durationMs  && { durationMs:  parsed.data.durationMs }),
        ...(parsed.data.nodeResults && { nodeResults: parsed.data.nodeResults as any }),
      },
    })
    res.json(run)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update run' })
  }
})

export default router
