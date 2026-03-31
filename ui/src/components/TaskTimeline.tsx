import type { OrchestratorEvent } from '../hooks/useSocket'

interface TaskState {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  agent?: string
  startedAt?: number
  completedAt?: number
}

function buildTaskStates(events: OrchestratorEvent[]): TaskState[] {
  const tasks = new Map<string, TaskState>()

  for (const evt of events) {
    const taskId = evt.task
    if (!taskId) continue

    if (evt.type === 'task_start') {
      tasks.set(taskId, {
        id: taskId,
        status: 'running',
        agent: evt.agent,
        startedAt: Date.now(),
      })
    } else if (evt.type === 'task_complete') {
      const t = tasks.get(taskId) ?? { id: taskId, status: 'pending' as const }
      tasks.set(taskId, { ...t, status: 'completed', completedAt: Date.now() })
    }
  }

  return Array.from(tasks.values())
}

const statusColor: Record<string, string> = {
  pending:   '#374151',
  running:   '#1e40af',
  completed: '#15803d',
  failed:    '#991b1b',
}

const statusBorder: Record<string, string> = {
  pending:   '#4b5563',
  running:   '#3b82f6',
  completed: '#22c55e',
  failed:    '#ef4444',
}

interface Props {
  events: OrchestratorEvent[]
}

export function TaskTimeline({ events }: Props) {
  const tasks = buildTaskStates(events)

  if (tasks.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Tasks will appear here once a run starts.
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: statusColor[task.status] ?? 'var(--surface2)',
            border: `1px solid ${statusBorder[task.status] ?? 'var(--border)'}`,
            borderRadius: 6,
            transition: 'all 0.3s',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: statusBorder[task.status] ?? '#4b5563',
              flexShrink: 0,
              boxShadow: task.status === 'running' ? `0 0 8px ${statusBorder[task.status]}` : 'none',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.id}
            </div>
            {task.agent && (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                assigned to {task.agent}
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: statusBorder[task.status], fontWeight: 600, textTransform: 'uppercase' }}>
            {task.status}
          </span>
        </div>
      ))}
    </div>
  )
}
