/**
 * Open Multi-Agent — Web Server
 * Express + Socket.io server that exposes the orchestrator via REST API
 * and streams real-time events to the browser dashboard.
 */

import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { OpenMultiAgent, Team } from '../src/index.js'
import type { OrchestratorEvent, AgentConfig, TeamConfig } from '../src/types.js'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.use(cors())
app.use(express.json())

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

interface Run {
  id: string
  goal: string
  teamName: string
  status: 'running' | 'completed' | 'failed'
  events: OrchestratorEvent[]
  result?: string
  error?: string
  startedAt: Date
  completedAt?: Date
}

interface StoredTeam {
  config: TeamConfig
  createdAt: Date
}

const runs = new Map<string, Run>()
const teams = new Map<string, StoredTeam>()

// Default demo team
const defaultTeam: TeamConfig = {
  name: 'demo',
  agents: [
    {
      name: 'researcher',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      systemPrompt: 'You are a research specialist. Gather and analyze information thoroughly.',
      tools: ['bash', 'grep'],
      maxTurns: 10,
    },
    {
      name: 'writer',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      systemPrompt: 'You are a technical writer. Produce clear, well-structured content.',
      maxTurns: 10,
    },
    {
      name: 'reviewer',
      model: 'claude-opus-4-6',
      provider: 'anthropic',
      systemPrompt: 'You are a quality reviewer. Ensure accuracy and completeness.',
      maxTurns: 8,
    },
  ] as AgentConfig[],
  sharedMemory: true,
  maxConcurrency: 3,
}

teams.set('demo', { config: defaultTeam, createdAt: new Date() })

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

/** GET /api/teams — list registered teams */
app.get('/api/teams', (_req, res) => {
  const list = Array.from(teams.entries()).map(([id, t]) => ({
    id,
    name: t.config.name,
    agents: t.config.agents.map((a) => ({ name: a.name, model: a.model })),
    createdAt: t.createdAt,
  }))
  res.json(list)
})

/** POST /api/teams — register a new team */
app.post('/api/teams', (req, res) => {
  const config = req.body as TeamConfig
  if (!config?.name || !Array.isArray(config.agents)) {
    return res.status(400).json({ error: 'Invalid team config: name and agents required' })
  }
  const id = config.name.toLowerCase().replace(/\s+/g, '-')
  teams.set(id, { config, createdAt: new Date() })
  return res.status(201).json({ id, name: config.name })
})

/** GET /api/teams/:id — get team details */
app.get('/api/teams/:id', (req, res) => {
  const team = teams.get(req.params.id)
  if (!team) return res.status(404).json({ error: 'Team not found' })
  return res.json({ id: req.params.id, ...team })
})

/** POST /api/teams/:id/run — execute a goal with a team */
app.post('/api/teams/:id/run', async (req, res) => {
  const stored = teams.get(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Team not found' })

  const { goal } = req.body as { goal: string }
  if (!goal?.trim()) return res.status(400).json({ error: 'goal is required' })

  const runId = uuidv4()
  const run: Run = {
    id: runId,
    goal,
    teamName: stored.config.name,
    status: 'running',
    events: [],
    startedAt: new Date(),
  }
  runs.set(runId, run)

  // Acknowledge immediately
  res.status(202).json({ runId })

  // Execute asynchronously
  ;(async () => {
    const orchestrator = new OpenMultiAgent({
      maxConcurrency: stored.config.maxConcurrency ?? 5,
      onProgress: (event: OrchestratorEvent) => {
        run.events.push(event)
        io.to(runId).emit('event', event)
        io.emit('run:update', { runId, event })
      },
    })

    try {
      const team = new Team(stored.config)
      const result = await orchestrator.runTeam(team, goal)
      run.status = result.success ? 'completed' : 'failed'
      run.result = result.success ? `Team run completed successfully` : 'Team run failed'
      run.completedAt = new Date()
    } catch (err) {
      run.status = 'failed'
      run.error = err instanceof Error ? err.message : String(err)
      run.completedAt = new Date()
    }

    io.to(runId).emit('run:done', { runId, status: run.status, result: run.result, error: run.error })
    io.emit('run:done', { runId, status: run.status })
  })()

  return
})

/** POST /api/agent/run — run a single one-off agent */
app.post('/api/agent/run', async (req, res) => {
  const { config, prompt } = req.body as { config: AgentConfig; prompt: string }
  if (!config || !prompt) return res.status(400).json({ error: 'config and prompt are required' })

  const runId = uuidv4()
  const run: Run = {
    id: runId,
    goal: prompt,
    teamName: config.name,
    status: 'running',
    events: [],
    startedAt: new Date(),
  }
  runs.set(runId, run)
  res.status(202).json({ runId })

  ;(async () => {
    const orchestrator = new OpenMultiAgent({
      onProgress: (event: OrchestratorEvent) => {
        run.events.push(event)
        io.to(runId).emit('event', event)
        io.emit('run:update', { runId, event })
      },
    })

    try {
      const result = await orchestrator.runAgent(config, prompt)
      run.status = result.success ? 'completed' : 'failed'
      run.result = result.output
      run.completedAt = new Date()
    } catch (err) {
      run.status = 'failed'
      run.error = err instanceof Error ? err.message : String(err)
      run.completedAt = new Date()
    }

    io.to(runId).emit('run:done', { runId, status: run.status, result: run.result, error: run.error })
    io.emit('run:done', { runId, status: run.status })
  })()

  return
})

/** GET /api/runs — list all runs */
app.get('/api/runs', (_req, res) => {
  const list = Array.from(runs.values()).map((r) => ({
    id: r.id,
    goal: r.goal,
    teamName: r.teamName,
    status: r.status,
    eventCount: r.events.length,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
  }))
  res.json(list.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()))
})

/** GET /api/runs/:id — get run details including events */
app.get('/api/runs/:id', (req, res) => {
  const run = runs.get(req.params.id)
  if (!run) return res.status(404).json({ error: 'Run not found' })
  return res.json(run)
})

/** GET /api/status — orchestrator health check */
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    teams: teams.size,
    runs: runs.size,
    activeRuns: Array.from(runs.values()).filter((r) => r.status === 'running').length,
  })
})

// ---------------------------------------------------------------------------
// Socket.io
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`)

  socket.on('subscribe:run', (runId: string) => {
    socket.join(runId)
    const run = runs.get(runId)
    if (run) {
      // Send buffered events for reconnects
      socket.emit('run:history', { runId, events: run.events, status: run.status })
    }
  })

  socket.on('disconnect', () => {
    console.log(`[ws] client disconnected: ${socket.id}`)
  })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT ?? 3001

httpServer.listen(PORT, () => {
  console.log(`Open Multi-Agent server running at http://localhost:${PORT}`)
  console.log(`API: http://localhost:${PORT}/api/status`)
})
