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
      { id: 'n2', type: 'llmNode', position: { x: 420, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'text_out', target: 'n2', targetHandle: 'user_message' },
    ],
  },
  {
    id: 'prompt-chainer',
    name: 'Prompt Chainer',
    description: 'Chain two LLM calls — first drafts, second refines',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 80, y: 200 }, data: { text: 'Write a short story about a robot.' } },
      { id: 'n2', type: 'llmNode', position: { x: 380, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
      { id: 'n3', type: 'llmNode', position: { x: 680, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'text_out', target: 'n2', targetHandle: 'user_message' },
      { id: 'e2', source: 'n2', sourceHandle: 'output', target: 'n3', targetHandle: 'user_message' },
    ],
  },
  {
    id: 'image-qa',
    name: 'Image + Context Q&A',
    description: 'Upload an image and ask the LLM a question about it',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 100, y: 120 }, data: {} },
      { id: 'n2', type: 'textNode', position: { x: 100, y: 320 }, data: { text: 'What is shown in this image?' } },
      { id: 'n3', type: 'llmNode', position: { x: 420, y: 220 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'image_url', target: 'n3', targetHandle: 'images' },
      { id: 'e2', source: 'n2', sourceHandle: 'text_out', target: 'n3', targetHandle: 'user_message' },
    ],
  },
  {
    id: 'video-scene-analyst',
    name: 'Video Scene Analyst',
    description: 'Extract a frame from a video and get an LLM scene analysis',
    nodes: [
      { id: 'n1', type: 'uploadVideoNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'extractFrameNode', position: { x: 380, y: 200 }, data: { timestamp: '0' } },
      { id: 'n3', type: 'llmNode', position: { x: 660, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'video_url', target: 'n2', targetHandle: 'video_url' },
      { id: 'e2', source: 'n2', sourceHandle: 'output', target: 'n3', targetHandle: 'images' },
    ],
  },
  {
    id: 'image-describer',
    name: 'Image Describer',
    description: 'Upload an image and let the LLM describe it in detail',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'llmNode', position: { x: 420, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'image_url', target: 'n2', targetHandle: 'images' },
    ],
  },
  {
    id: 'content-rewriter',
    name: 'Content Rewriter',
    description: 'Rewrite any text in a different tone or style',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 100, y: 200 }, data: { text: 'Paste your content here...' } },
      { id: 'n2', type: 'llmNode', position: { x: 420, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'text_out', target: 'n2', targetHandle: 'user_message' },
    ],
  },
  {
    id: 'image-crop-caption',
    name: 'Crop & Caption',
    description: 'Upload an image, crop it, then generate a caption',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 80, y: 200 }, data: {} },
      { id: 'n2', type: 'cropImageNode', position: { x: 360, y: 200 }, data: {} },
      { id: 'n3', type: 'llmNode', position: { x: 640, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'image_url', target: 'n2', targetHandle: 'image_url' },
      { id: 'e2', source: 'n2', sourceHandle: 'output', target: 'n3', targetHandle: 'images' },
    ],
  },
  {
    id: 'video-thumbnail',
    name: 'Video Thumbnail',
    description: 'Extract a frame from a video and crop it into a thumbnail',
    nodes: [
      { id: 'n1', type: 'uploadVideoNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'extractFrameNode', position: { x: 380, y: 200 }, data: { timestamp: '0' } },
      { id: 'n3', type: 'cropImageNode', position: { x: 660, y: 200 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'video_url', target: 'n2', targetHandle: 'video_url' },
      { id: 'e2', source: 'n2', sourceHandle: 'output', target: 'n3', targetHandle: 'image_url' },
    ],
  },
]
