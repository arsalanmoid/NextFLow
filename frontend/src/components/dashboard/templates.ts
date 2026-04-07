import type { Node, Edge } from 'reactflow'

export interface Template {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Paste any text and get a concise summary using LLM',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 100, y: 200 }, data: { text: 'Paste your text here...' } },
      { id: 'n2', type: 'llmNode', position: { x: 420, y: 200 }, data: { prompt: 'Summarize the following text concisely:\n\n{{input}}' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
    ],
  },
  {
    id: 'prompt-chainer',
    name: 'Prompt Chainer',
    description: 'Chain two LLM calls — first drafts, second refines',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 80, y: 200 }, data: { text: 'Write a short story about a robot.' } },
      { id: 'n2', type: 'llmNode', position: { x: 380, y: 200 }, data: { prompt: '{{input}}' } },
      { id: 'n3', type: 'llmNode', position: { x: 680, y: 200 }, data: { prompt: 'Improve the following text, making it more vivid and engaging:\n\n{{input}}' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  {
    id: 'image-qa',
    name: 'Image + Context Q&A',
    description: 'Upload an image and ask the LLM a question about it',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 100, y: 120 }, data: {} },
      { id: 'n2', type: 'textNode', position: { x: 100, y: 320 }, data: { text: 'What is shown in this image?' } },
      { id: 'n3', type: 'llmNode', position: { x: 420, y: 220 }, data: { prompt: 'Image: {{image}}\n\nQuestion: {{text}}\n\nAnswer:' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  {
    id: 'video-scene-analyst',
    name: 'Video Scene Analyst',
    description: 'Extract a frame from a video and get an LLM scene analysis',
    nodes: [
      { id: 'n1', type: 'uploadVideoNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'extractFrameNode', position: { x: 380, y: 200 }, data: { timestamp: 0 } },
      { id: 'n3', type: 'llmNode', position: { x: 660, y: 200 }, data: { prompt: 'Describe the scene in detail. What is happening? What are the key visual elements?' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  {
    id: 'image-describer',
    name: 'Image Describer',
    description: 'Upload an image and let the LLM describe it in detail',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'llmNode', position: { x: 420, y: 200 }, data: { prompt: 'Describe this image in detail.' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
    ],
  },
  {
    id: 'content-rewriter',
    name: 'Content Rewriter',
    description: 'Rewrite any text in a different tone or style',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 100, y: 200 }, data: { text: 'Paste your content here...' } },
      { id: 'n2', type: 'llmNode', position: { x: 420, y: 200 }, data: { prompt: 'Rewrite the following text to be more professional and concise:\n\n{{input}}' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
    ],
  },
  {
    id: 'image-crop-caption',
    name: 'Crop & Caption',
    description: 'Upload an image, crop it, then generate a caption',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 80, y: 200 }, data: {} },
      { id: 'n2', type: 'cropImageNode', position: { x: 360, y: 200 }, data: {} },
      { id: 'n3', type: 'llmNode', position: { x: 640, y: 200 }, data: { prompt: 'Write a short, catchy caption for this image.' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  {
    id: 'video-thumbnail',
    name: 'Video Thumbnail',
    description: 'Extract a frame from a video and crop it into a thumbnail',
    nodes: [
      { id: 'n1', type: 'uploadVideoNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'extractFrameNode', position: { x: 380, y: 200 }, data: { timestamp: 0 } },
      { id: 'n3', type: 'cropImageNode', position: { x: 660, y: 200 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
]
