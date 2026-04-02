import { Info } from 'lucide-react'

interface NodeCardProps {
  title: string
  cuCost?: number
  executionStatus?: 'idle' | 'running' | 'success' | 'error'
  previewContent?: React.ReactNode
  children?: React.ReactNode
}

export function NodeCard({
  title,
  cuCost = 1,
  executionStatus = 'idle',
  previewContent,
  children,
}: NodeCardProps) {
  const statusClass =
    executionStatus === 'running' ? 'node-running' :
    executionStatus === 'success' ? 'node-success'  :
    executionStatus === 'error'   ? 'node-error'    : ''

  return (
    <div className={statusClass} style={{ position: 'relative' }}>
      {/* Card */}
      <div
        className="nf-node-card"
        style={{
          width: 255,
          background: '#1e1e1e',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{cuCost} CU</span>
            <Info size={12} style={{ color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Preview area */}
        <div style={{
          width: '100%',
          height: 220,
          background: '#161616',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: children ? '1px solid rgba(255,255,255,0.05)' : 'none',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}>
          {previewContent ?? (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', userSelect: 'none' }}>
              Results will appear here
            </span>
          )}
        </div>

        {/* Content slot */}
        {children && (
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
