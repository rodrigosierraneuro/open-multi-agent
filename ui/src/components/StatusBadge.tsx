import type { CSSProperties } from 'react'

const colors: Record<string, { bg: string; color: string }> = {
  running:   { bg: '#1e3a5f', color: '#60a5fa' },
  completed: { bg: '#14532d', color: '#4ade80' },
  failed:    { bg: '#450a0a', color: '#f87171' },
  pending:   { bg: '#1c1917', color: '#a8a29e' },
  blocked:   { bg: '#292524', color: '#78716c' },
  in_progress: { bg: '#1e3a5f', color: '#60a5fa' },
}

interface Props {
  status: string
  style?: CSSProperties
}

export function StatusBadge({ status, style }: Props) {
  const c = colors[status] ?? { bg: '#1a1d27', color: '#718096' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.color,
        ...style,
      }}
    >
      {status}
    </span>
  )
}
