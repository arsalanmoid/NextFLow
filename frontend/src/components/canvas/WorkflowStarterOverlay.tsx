import { X } from 'lucide-react'
import type { Node, Edge } from 'reactflow'

const font = '"Suisse Intl", ui-sans-serif, system-ui, sans-serif'
const fontMono = '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif'

interface StarterPreset {
  id: string
  title: string
  description: string
  nodes: Node[]
  edges: Edge[]
  // thumbnail layout (static, for display only)
  thumb: { rects: { x: number; y: number; w: number; h: number; fill: string }[]; lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] }
}

const PRESETS: StarterPreset[] = [
  {
    id: 'text-summarizer',
    title: 'Text Summarizer',
    description: 'Paste text, get a concise summary from LLM',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 100, y: 200 }, data: { text: 'Paste your text here...' } },
      { id: 'n2', type: 'llmNode',  position: { x: 420, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [{ id: 'e1', source: 'n1', sourceHandle: 'text_out', target: 'n2', targetHandle: 'user_message' }],
    thumb: {
      rects: [
        { x: 10, y: 28, w: 38, h: 24, fill: '#2e2e2e' },
        { x: 72, y: 24, w: 38, h: 32, fill: '#2a2642' },
      ],
      lines: [{ x1: 48, y1: 40, x2: 72, y2: 40, color: '#eab308' }],
    },
  },
  {
    id: 'prompt-chainer',
    title: 'Prompt Chainer',
    description: 'Chain two LLMs — first drafts, second refines',
    nodes: [
      { id: 'n1', type: 'textNode', position: { x: 80,  y: 200 }, data: { text: 'Write a short story about a robot.' } },
      { id: 'n2', type: 'llmNode',  position: { x: 380, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
      { id: 'n3', type: 'llmNode',  position: { x: 680, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'text_out', target: 'n2', targetHandle: 'user_message' },
      { id: 'e2', source: 'n2', sourceHandle: 'output',   target: 'n3', targetHandle: 'user_message' },
    ],
    thumb: {
      rects: [
        { x: 5,  y: 32, w: 26, h: 16, fill: '#2e2e2e' },
        { x: 43, y: 28, w: 30, h: 24, fill: '#2a2642' },
        { x: 85, y: 28, w: 30, h: 24, fill: '#2a2642' },
      ],
      lines: [
        { x1: 31, y1: 40, x2: 43, y2: 40, color: '#eab308' },
        { x1: 73, y1: 40, x2: 85, y2: 40, color: '#a855f7' },
      ],
    },
  },
  {
    id: 'image-describer',
    title: 'Image Describer',
    description: 'Upload an image, LLM describes it in detail',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'llmNode',         position: { x: 420, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [{ id: 'e1', source: 'n1', sourceHandle: 'image_url', target: 'n2', targetHandle: 'images' }],
    thumb: {
      rects: [
        { x: 10, y: 26, w: 38, h: 28, fill: '#1e3a2e' },
        { x: 72, y: 24, w: 38, h: 32, fill: '#2a2642' },
      ],
      lines: [{ x1: 48, y1: 40, x2: 72, y2: 40, color: '#3b82f6' }],
    },
  },
  {
    id: 'image-qa',
    title: 'Image Q&A',
    description: 'Upload an image and ask the LLM questions about it',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 100, y: 120 }, data: {} },
      { id: 'n2', type: 'textNode',        position: { x: 100, y: 320 }, data: { text: 'What is shown in this image?' } },
      { id: 'n3', type: 'llmNode',         position: { x: 420, y: 220 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'image_url', target: 'n3', targetHandle: 'images' },
      { id: 'e2', source: 'n2', sourceHandle: 'text_out',  target: 'n3', targetHandle: 'user_message' },
    ],
    thumb: {
      rects: [
        { x: 8, y: 12, w: 34, h: 22, fill: '#1e3a2e' },
        { x: 8, y: 46, w: 34, h: 18, fill: '#2e2e2e' },
        { x: 68, y: 24, w: 38, h: 32, fill: '#2a2642' },
      ],
      lines: [
        { x1: 42, y1: 23, x2: 68, y2: 35, color: '#3b82f6' },
        { x1: 42, y1: 55, x2: 68, y2: 45, color: '#eab308' },
      ],
    },
  },
  {
    id: 'crop-caption',
    title: 'Crop & Caption',
    description: 'Upload an image, crop a region, then caption it',
    nodes: [
      { id: 'n1', type: 'uploadImageNode', position: { x: 80,  y: 200 }, data: {} },
      { id: 'n2', type: 'cropImageNode',   position: { x: 360, y: 200 }, data: { xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 } },
      { id: 'n3', type: 'llmNode',         position: { x: 640, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'image_url', target: 'n2', targetHandle: 'image_url' },
      { id: 'e2', source: 'n2', sourceHandle: 'output',    target: 'n3', targetHandle: 'images' },
    ],
    thumb: {
      rects: [
        { x: 5,  y: 30, w: 28, h: 20, fill: '#1e3a2e' },
        { x: 45, y: 30, w: 28, h: 20, fill: '#1e2a3e' },
        { x: 85, y: 28, w: 28, h: 24, fill: '#2a2642' },
      ],
      lines: [
        { x1: 33, y1: 40, x2: 45, y2: 40, color: '#3b82f6' },
        { x1: 73, y1: 40, x2: 85, y2: 40, color: '#3b82f6' },
      ],
    },
  },
  {
    id: 'video-scene',
    title: 'Video Scene Analyst',
    description: 'Extract a frame from video, get LLM scene analysis',
    nodes: [
      { id: 'n1', type: 'uploadVideoNode',  position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'extractFrameNode', position: { x: 380, y: 200 }, data: { timestamp: '0' } },
      { id: 'n3', type: 'llmNode',          position: { x: 660, y: 200 }, data: { model: 'gemini-2.5-flash-lite' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'video_url', target: 'n2', targetHandle: 'video_url' },
      { id: 'e2', source: 'n2', sourceHandle: 'output',    target: 'n3', targetHandle: 'images' },
    ],
    thumb: {
      rects: [
        { x: 5,  y: 30, w: 28, h: 20, fill: '#3a1e1e' },
        { x: 45, y: 30, w: 28, h: 20, fill: '#1e2e3a' },
        { x: 85, y: 28, w: 28, h: 24, fill: '#2a2642' },
      ],
      lines: [
        { x1: 33, y1: 40, x2: 45, y2: 40, color: '#3b82f6' },
        { x1: 73, y1: 40, x2: 85, y2: 40, color: '#3b82f6' },
      ],
    },
  },
  {
    id: 'video-thumbnail',
    title: 'Video Thumbnail',
    description: 'Extract a frame from video and crop it',
    nodes: [
      { id: 'n1', type: 'uploadVideoNode',  position: { x: 100, y: 200 }, data: {} },
      { id: 'n2', type: 'extractFrameNode', position: { x: 380, y: 200 }, data: { timestamp: '0' } },
      { id: 'n3', type: 'cropImageNode',    position: { x: 660, y: 200 }, data: { xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourceHandle: 'video_url', target: 'n2', targetHandle: 'video_url' },
      { id: 'e2', source: 'n2', sourceHandle: 'output',    target: 'n3', targetHandle: 'image_url' },
    ],
    thumb: {
      rects: [
        { x: 5,  y: 30, w: 28, h: 20, fill: '#3a1e1e' },
        { x: 45, y: 30, w: 28, h: 20, fill: '#1e2e3a' },
        { x: 85, y: 30, w: 28, h: 20, fill: '#1e2a3e' },
      ],
      lines: [
        { x1: 33, y1: 40, x2: 45, y2: 40, color: '#3b82f6' },
        { x1: 73, y1: 40, x2: 85, y2: 40, color: '#3b82f6' },
      ],
    },
  },
]

interface Props {
  onSelect: (nodes: Node[], edges: Edge[]) => void
  onDismiss: () => void
}

export function WorkflowStarterOverlay({ onSelect, onDismiss }: Props) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 15,
        background: 'rgba(16,16,16,0.75)',
        backdropFilter: 'blur(2px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 32, paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: fontMono }}>
          Start with a sample workflow or build from scratch
        </p>
      </div>

      {/* Cards row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 900 }}>
        {PRESETS.map(preset => (
          <div
            key={preset.id}
            onClick={() => onSelect(preset.nodes, preset.edges)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, width: 200 }}
          >
            {/* Thumbnail */}
            <div
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#333333')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
              style={{
                height: 150, borderRadius: 10,
                background: '#141414',
                border: '1px solid #1e1e1e',
                overflow: 'hidden', position: 'relative',
                transition: 'border-color .2s',
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet">
                {preset.thumb.lines.map((l, i) => {
                  const midX = (l.x1 + l.x2) / 2
                  return (
                    <path
                      key={i}
                      d={`M${l.x1},${l.y1} C${midX},${l.y1} ${midX},${l.y2} ${l.x2},${l.y2}`}
                      fill="none" stroke={l.color} strokeWidth="1.5" strokeLinecap="round"
                    />
                  )
                })}
                {preset.thumb.rects.map((r, i) => (
                  <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx="3" fill={r.fill} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                ))}
              </svg>
            </div>

            {/* Text */}
            <div style={{ padding: '0 2px' }}>
              <p style={{ fontSize: 16, fontWeight: 400, color: 'oklch(0.985 0 0)', fontFamily: font, lineHeight: '24px', marginBottom: 2 }}>{preset.title}</p>
              <p style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)', fontFamily: font, lineHeight: 1.5 }}>{preset.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 8,
          background: '#202020', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: fontMono,
          cursor: 'pointer', transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = '#202020')}
      >
        <X size={13} /> Start from scratch
      </button>
    </div>
  )
}
