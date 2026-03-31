import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export interface OrchestratorEvent {
  type: 'agent_start' | 'agent_complete' | 'task_start' | 'task_complete' | 'message' | 'error'
  agent?: string
  task?: string
  data?: unknown
}

export interface RunUpdate {
  runId: string
  event?: OrchestratorEvent
  status?: string
}

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: '/socket.io' })
  }
  return socket
}

export function useSocket() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const s = getSocket()
    setConnected(s.connected)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
    }
  }, [])

  return { socket: getSocket(), connected }
}

export function useRunEvents(runId: string | null) {
  const [events, setEvents] = useState<OrchestratorEvent[]>([])
  const [status, setStatus] = useState<string>('pending')
  const [result, setResult] = useState<string | null>(null)
  const subscribedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!runId) return
    const s = getSocket()

    if (subscribedRef.current !== runId) {
      setEvents([])
      setStatus('running')
      setResult(null)
      subscribedRef.current = runId
      s.emit('subscribe:run', runId)
    }

    const onHistory = (data: { runId: string; events: OrchestratorEvent[]; status: string }) => {
      if (data.runId === runId) {
        setEvents(data.events)
        setStatus(data.status)
      }
    }

    const onEvent = (event: OrchestratorEvent) => {
      setEvents((prev) => [...prev, event])
    }

    const onDone = (data: { runId: string; status: string; result?: string; error?: string }) => {
      if (data.runId === runId) {
        setStatus(data.status)
        setResult(data.result ?? data.error ?? null)
      }
    }

    s.on('run:history', onHistory)
    s.on('event', onEvent)
    s.on('run:done', onDone)

    return () => {
      s.off('run:history', onHistory)
      s.off('event', onEvent)
      s.off('run:done', onDone)
    }
  }, [runId])

  return { events, status, result }
}
