import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

const NodeSchema = z.object({
  id:       z.string(),
  type:     z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data:     z.record(z.unknown()),
})

const EdgeSchema = z.object({
  id:           z.string(),
  source:       z.string(),
  target:       z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  animated:     z.boolean().optional(),
  style:        z.record(z.unknown()).optional(),
  type:         z.string().optional(),
})

const SaveWorkflowSchema = z.object({
  name:  z.string().min(1).max(200),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
})

// ── GET /api/workflows — list user's workflows ────────────────
router.get('/', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  try {
    const workflows = await prisma.workflow.findMany({
      where:   { userId: userId! },
      orderBy: { updatedAt: 'desc' },
      select:  { id: true, name: true, updatedAt: true, createdAt: true, nodes: true, edges: true },
    })
    res.json(workflows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workflows' })
  }
})

// ── POST /api/workflows — create new workflow ─────────────────
router.post('/', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const parsed = SaveWorkflowSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  try {
    const workflow = await prisma.workflow.create({
      data: {
        userId: userId!,
        name:   parsed.data.name,
        nodes:  parsed.data.nodes as any,
        edges:  parsed.data.edges as any,
      },
    })
    res.status(201).json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create workflow' })
  }
})

// ── GET /api/workflows/:id — get single workflow ──────────────
router.get('/:id', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const id = String(req.params.id)
  try {
    const workflow = await prisma.workflow.findFirst({
      where:   { id, userId: userId! },
      include: { runs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    if (!workflow) { res.status(404).json({ error: 'Not found' }); return }
    res.json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch workflow' })
  }
})

// ── PUT /api/workflows/:id — save/update workflow ─────────────
router.put('/:id', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const id = String(req.params.id)
  const parsed = SaveWorkflowSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  try {
    const existing = await prisma.workflow.findFirst({ where: { id, userId: userId! } })
    if (!existing) { res.status(404).json({ error: 'Not found' }); return }

    const workflow = await prisma.workflow.update({
      where: { id },
      data:  {
        name:  parsed.data.name,
        nodes: parsed.data.nodes as any,
        edges: parsed.data.edges as any,
      },
    })
    res.json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update workflow' })
  }
})

// ── DELETE /api/workflows/:id ─────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const { userId } = getAuth(req)
  const id = String(req.params.id)
  try {
    const existing = await prisma.workflow.findFirst({ where: { id, userId: userId! } })
    if (!existing) { res.status(404).json({ error: 'Not found' }); return }
    await prisma.workflow.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete workflow' })
  }
})

export default router
