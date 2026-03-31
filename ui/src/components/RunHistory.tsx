import { StatusBadge } from './StatusBadge'

interface RunSummary {
  id: string
  goal: string
  teamName: string
  status: string
  eventCount: number
  startedAt: string
  completedAt?: string
}

interface Props {
  runs: RunSummary[]
  onSelect: (runId: string) => void
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

export function RunHistory({ runs, onSelect }: Props) {
  if (runs.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No runs yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {runs.map((run, i) => (
        <div
          key={run.id}
          onClick={() => onSelect(run.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            borderBottom: i < runs.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
        >
          <StatusBadge status={run.status} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {run.goal}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {run.teamName} · {run.eventCount} events · {relativeTime(run.startedAt)}
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            {run.id.slice(0, 6)}
          </span>
        </div>
      ))}
    </div>
  )
}
