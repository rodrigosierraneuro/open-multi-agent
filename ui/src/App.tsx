import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './hooks/useSocket'
import { RunPanel } from './components/RunPanel'
import { RunHistory } from './components/RunHistory'
import { TeamCard } from './components/TeamCard'

interface Team {
  id: string
  name: string
  agents: { name: string; model: string }[]
  createdAt?: string
}

interface RunSummary {
  id: string
  goal: string
  teamName: string
  status: string
  eventCount: number
  startedAt: string
  completedAt?: string
}

type View = 'run' | 'history' | 'teams'

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'run', label: 'Run', icon: '▶' },
  { id: 'history', label: 'History', icon: '○' },
  { id: 'teams', label: 'Teams', icon: '◈' },
]

export default function App() {
  const { connected } = useSocket()
  const [view, setView] = useState<View>('run')
  const [teams, setTeams] = useState<Team[]>([])
  const [runs, setRuns] = useState<RunSummary[]>([])

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams')
      setTeams(await res.json())
    } catch {
      // ignore
    }
  }, [])

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/runs')
      setRuns(await res.json())
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchTeams()
    fetchRuns()
    const interval = setInterval(() => {
      fetchRuns()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchTeams, fetchRuns])

  function handleRunStarted(_runId: string) {
    setTimeout(fetchRuns, 500)
  }

  function handleSelectRun(_runId: string) {
    setView('history')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ⬡
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Multi-Agent</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dashboard</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                background: view === item.id ? 'var(--surface2)' : 'transparent',
                color: view === item.id ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: view === item.id ? 600 : 400,
                fontSize: 13,
                textAlign: 'left',
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected ? 'var(--green)' : 'var(--red)',
              boxShadow: connected ? '0 0 6px var(--green)' : 'none',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>

          {view === 'run' && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Run a Goal</h1>
              <RunPanel teams={teams} onRunStarted={handleRunStarted} />
            </>
          )}

          {view === 'history' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700 }}>Run History</h1>
                <button
                  onClick={fetchRuns}
                  style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, padding: '6px 12px' }}
                >
                  Refresh
                </button>
              </div>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}
              >
                <RunHistory runs={runs} onSelect={handleSelectRun} />
              </div>
            </>
          )}

          {view === 'teams' && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Teams</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {teams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
                {teams.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
                    No teams registered.
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  )
}
