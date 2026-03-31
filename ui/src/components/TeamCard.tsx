interface Agent {
  name: string
  model: string
}

interface Team {
  id: string
  name: string
  agents: Agent[]
  createdAt?: string
}

interface Props {
  team: Team
}

const modelColor = (model: string) => {
  if (model.includes('opus')) return '#a78bfa'
  if (model.includes('sonnet')) return '#60a5fa'
  if (model.includes('haiku')) return '#34d399'
  if (model.includes('gpt-4')) return '#f59e0b'
  return '#718096'
}

export function TeamCard({ team }: Props) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {team.name[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{team.agents.length} agents</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {team.agents.map((agent) => (
          <div
            key={agent.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'var(--surface2)',
              borderRadius: 6,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{agent.name}</span>
            <span
              style={{
                fontSize: 11,
                color: modelColor(agent.model),
                fontFamily: 'var(--mono)',
              }}
            >
              {agent.model.split('-').slice(-2).join('-')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
