import { useState } from 'react'
import { useRunEvents } from '../hooks/useSocket'
import { EventLog } from './EventLog'
import { TaskTimeline } from './TaskTimeline'
import { StatusBadge } from './StatusBadge'

interface Team {
  id: string
  name: string
  agents: { name: string; model: string }[]
}

interface Props {
  teams: Team[]
  onRunStarted: (runId: string) => void
}

export function RunPanel({ teams, onRunStarted }: Props) {
  const [selectedTeam, setSelectedTeam] = useState('')
  const [goal, setGoal] = useState('')
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [tab, setTab] = useState<'events' | 'tasks'>('events')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { events, status, result } = useRunEvents(activeRunId)

  async function handleRun() {
    if (!selectedTeam || !goal.trim()) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/teams/${selectedTeam}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setActiveRunId(data.runId)
      onRunStarted(data.runId)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start run')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Form */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Run a Goal</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Team
            </label>
            <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
              <option value="">Select a team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.agents.length} agents)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Goal
            </label>
            <textarea
              rows={3}
              placeholder="Describe what the team should accomplish…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--red)', fontSize: 12 }}>{errorMsg}</div>
          )}

          <button
            onClick={handleRun}
            disabled={!selectedTeam || !goal.trim() || isSubmitting}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              alignSelf: 'flex-start',
            }}
          >
            {isSubmitting ? 'Starting…' : 'Run Team'}
          </button>
        </div>
      </div>

      {/* Active run */}
      {activeRunId && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                {activeRunId.slice(0, 8)}…
              </span>
              <StatusBadge status={status} style={{ marginLeft: 10 }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['events', 'tasks'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: tab === t ? 'var(--accent)' : 'var(--surface2)',
                    color: tab === t ? '#fff' : 'var(--text-muted)',
                    padding: '4px 12px',
                    fontSize: 12,
                  }}
                >
                  {t === 'events' ? `Events (${events.length})` : 'Tasks'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'events' ? (
            <EventLog events={events} />
          ) : (
            <TaskTimeline events={events} />
          )}

          {result && (status === 'completed' || status === 'failed') && (
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                background: status === 'completed' ? '#0f2818' : '#1f0a0a',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Result</div>
              <div style={{ fontSize: 13, color: status === 'completed' ? 'var(--green)' : 'var(--red)' }}>
                {result}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
