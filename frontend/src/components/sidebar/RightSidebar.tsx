import { useState } from 'react'
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { WorkflowRun } from '../../types'

function statusColor(status: WorkflowRun['status']) {
  if (status === 'SUCCESS') return '#22c55e'
  if (status === 'FAILED')  return '#ef4444'
  if (status === 'RUNNING') return '#eab308'
  return '#6b7280'
}

function StatusIcon({ status }: { status: WorkflowRun['status'] }) {
  if (status === 'SUCCESS') return <CheckCircle2 size={13} color="#22c55e" />
  if (status === 'FAILED')  return <XCircle size={13} color="#ef4444" />
  if (status === 'RUNNING') return <Clock size={13} color="#eab308" />
  return <Clock size={13} color="#6b7280" />
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}


function RunEntry({ run, index }: { run: WorkflowRun; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 5,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      {/* Run header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 8,
        }}
      >
        {/* Left: status dot + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <StatusIcon status={run.status} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif', whiteSpace: 'nowrap' }}>
              Run #{index}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif' }}>
              {formatTime(run.createdAt)}{run.durationMs != null && ` · ${(run.durationMs / 1000).toFixed(1)}s`}
            </p>
          </div>
        </div>

        {/* Right: status pill + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 500,
            color: statusColor(run.status),
            background: `${statusColor(run.status)}18`,
            padding: '2px 7px', borderRadius: 999,
            fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif',
            letterSpacing: '0.01em',
          }}>
            {run.status}
          </span>
          {expanded ? <ChevronUp size={11} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={11} color="rgba(255,255,255,0.3)" />}
        </div>
      </button>

      {/* Expanded node results */}
      {expanded && (
        <div style={{ padding: '0 10px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {run.nodeResults.length === 0 ? (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingTop: 8 }}>No node data</p>
          ) : run.nodeResults.map((nr, i) => (
            <div key={nr.nodeId} style={{ paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                  {i === run.nodeResults.length - 1 ? '└─' : '├─'}
                </span>
                <span style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 500 }}>
                  {nr.nodeType.replace('Node', '').replace(/([A-Z])/g, ' $1').trim()} ({nr.nodeId})
                </span>
                {nr.status === 'success' && <CheckCircle2 size={11} color="#22c55e" />}
                {nr.status === 'error'   && <XCircle size={11} color="#ef4444" />}
                {nr.durationMs != null && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{(nr.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
              {nr.output != null && (
                <div style={{ marginLeft: 18, marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  └─ Output: "{String(nr.output).slice(0, 80)}{String(nr.output).length > 80 ? '…' : ''}"
                </div>
              )}
              {nr.error && (
                <div style={{ marginLeft: 18, marginTop: 3, fontSize: 10, color: '#ef4444' }}>
                  └─ Error: {nr.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function RightSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const runs = useWorkflowStore(s => s.runs)

  return (
    <div
      className="sidebar-transition"
      style={{
        width: collapsed ? 36 : 260,
        minWidth: collapsed ? 36 : 260,
        height: '100%',
        background: '#0c0c0c',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {collapsed ? (
        <div style={{ padding: '10px 6px' }}>
          <button
            onClick={() => setCollapsed(false)}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: 'rgba(255,255,255,0.5)', padding: '3px 5px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              transition: 'background 0.2s ease',
            }}
          >
            <ChevronLeft size={13} />
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setCollapsed(true)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, color: 'rgba(255,255,255,0.5)',
                padding: '3px 5px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <ChevronRight size={13} />
            </button>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif' }}>
              Run History
            </p>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 8px' }}>
            {runs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No runs yet</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 6, lineHeight: 1.5 }}>
                  Click Run to execute the workflow
                </p>
              </div>
            ) : (
              runs.map((run, i) => (
                <RunEntry key={run.id} run={run} index={runs.length - i} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

