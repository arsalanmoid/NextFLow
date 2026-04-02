import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_USER_ID = process.env.SEED_USER_ID ?? 'demo_user'

async function main() {
  // "Product Marketing Kit" sample workflow
  const nodes = [
    {
      id: 'text-system',
      type: 'textNode',
      position: { x: 50, y: 80 },
      data: {
        text: 'You are a creative marketing copywriter. Write compelling, concise product descriptions.',
      },
    },
    {
      id: 'text-prompt',
      type: 'textNode',
      position: { x: 50, y: 280 },
      data: {
        text: 'Write a short marketing tagline for a premium wireless headphone brand called "SonicFlow". Make it catchy and modern.',
      },
    },
    {
      id: 'llm-1',
      type: 'llmNode',
      position: { x: 400, y: 140 },
      data: {
        model: 'gemini-2.0-flash',
      },
    },
    {
      id: 'upload-img',
      type: 'uploadImageNode',
      position: { x: 50, y: 500 },
      data: {},
    },
    {
      id: 'crop-1',
      type: 'cropImageNode',
      position: { x: 400, y: 480 },
      data: {
        xPercent: 10,
        yPercent: 10,
        widthPercent: 80,
        heightPercent: 80,
      },
    },
  ]

  const edges = [
    {
      id: 'e-sys-llm',
      source: 'text-system',
      sourceHandle: 'text_out',
      target: 'llm-1',
      targetHandle: 'system_prompt',
      type: 'default',
    },
    {
      id: 'e-prompt-llm',
      source: 'text-prompt',
      sourceHandle: 'text_out',
      target: 'llm-1',
      targetHandle: 'user_message',
      type: 'default',
    },
    {
      id: 'e-img-crop',
      source: 'upload-img',
      sourceHandle: 'image_url',
      target: 'crop-1',
      targetHandle: 'image_url',
      type: 'default',
    },
  ]

  const workflow = await prisma.workflow.create({
    data: {
      userId: DEMO_USER_ID,
      name: 'Product Marketing Kit',
      nodes: nodes as any,
      edges: edges as any,
    },
  })

  console.log(`Seeded workflow: ${workflow.id} — "${workflow.name}"`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
