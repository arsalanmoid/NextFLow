import { task } from '@trigger.dev/sdk/v3'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface LLMInput {
  model: string
  systemPrompt?: string
  userMessage: string
  imageUrls?: string[]
}

export const llmTask = task({
  id: 'llm-run',
  retry: { maxAttempts: 2 },
  run: async (payload: LLMInput) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: payload.model,
    })

    // Build parts array
    const parts: any[] = []

    // System instruction (if provided)
    if (payload.systemPrompt) {
      parts.push({ text: `System: ${payload.systemPrompt}\n\n` })
    }

    // User message
    parts.push({ text: payload.userMessage })

    // Images for multimodal/vision
    if (payload.imageUrls && payload.imageUrls.length > 0) {
      for (const url of payload.imageUrls) {
        try {
          const res = await fetch(url)
          const buffer = Buffer.from(await res.arrayBuffer())
          const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
          parts.push({
            inlineData: {
              data: buffer.toString('base64'),
              mimeType,
            },
          })
        } catch (err) {
          console.warn(`Failed to fetch image ${url}:`, err)
        }
      }
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
    const text = result.response.text()

    return { output: text }
  },
})
