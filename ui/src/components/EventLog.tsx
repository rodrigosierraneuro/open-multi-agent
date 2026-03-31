import { useEffect, useRef } from 'react'
import type { OrchestratorEvent } from '../hooks/useSocket'

const eventColor: Record<string, string> = {
  agent_start:    '#60a5fa',
  agent_complete: '#4ade80',
  task_start:     '#a78bfa',
  task_complete:  '#34d399',
  message:        '#e2e8f0',
  error:          '#f87171',
}

const eventIcon: Record<string, string> = {
  agent_start:    '▶',
  agent_complete: '✓',
  task_start:     '◆',
  task_complete:  '◇',
  message:        '·',
  error:          '✕',
}

interface Props {
  events: OrchestratorEvent[]
}

export function EventLog({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  if (events.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No events yet. Start a run to see activity.
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 12,
        lineHeight: 1.6,
        overflowY: 'auto',
        maxHeight: 400,
        padding: '12px 16px',
      }}
    >
      {events.map((evt, i) => {
        const color = eventColor[evt.type] ?? '#e2e8f0'
        const icon = eventIcon[evt.type] ?? '·'
        const label = [evt.agent, evt.task].filter(Boolean).join(' › ')
        const detail =
          evt.data && typeof evt.data === 'string' ? evt.data : ''

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '2px 0',
              borderBottom: i < events.length - 1 ? '1px solid #1e2235' : 'none',
            }}
          >
            <span style={{ color, minWidth: 16, userSelect: 'none' }}>{icon}</span>
            <span style={{ color: 'var(--text-muted)', minWidth: 110 }}>{evt.type}</span>
            <span style={{ color: '#94a3b8', minWidth: 120 }}>{label}</span>
            {detail && (
              <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {detail}
              </span>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
