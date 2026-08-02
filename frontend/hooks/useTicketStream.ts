"use client"

import { useEffect, useRef, useState } from "react"

import { getTicketsWebSocketUrl, type Ticket, type TicketCommentRead } from "@/lib/api"

type BaseTicketStreamEvent = {
  ticket_id: string
  emitted_at: string
}

type TicketCreatedOrUpdatedEvent = BaseTicketStreamEvent & {
  event: "ticket.creado" | "ticket.actualizado"
  payload: Ticket
}

type TicketCommentedEvent = BaseTicketStreamEvent & {
  event: "ticket.comentado"
  payload: TicketCommentRead
}

export type TicketStreamEvent = TicketCreatedOrUpdatedEvent | TicketCommentedEvent

type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected"

type UseTicketStreamOptions = {
  ticketId?: string
  onEvent?: (event: TicketStreamEvent) => void
}

const MAX_BACKOFF_MS = 30_000

export function useTicketStream({ ticketId, onEvent }: UseTicketStreamOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmountedRef = useRef(false)

  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [nextRetryInMs, setNextRetryInMs] = useState<number | null>(null)

  useEffect(() => {
    unmountedRef.current = false

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      setNextRetryInMs(null)
    }

    const closeSocket = () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }

    const scheduleReconnect = () => {
      if (unmountedRef.current) {
        return
      }

      const nextDelay = Math.min(1000 * 2 ** retryCountRef.current, MAX_BACKOFF_MS)
      retryCountRef.current += 1
      setStatus("reconnecting")
      setNextRetryInMs(nextDelay)

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null
        connect()
      }, nextDelay)
    }

    const connect = () => {
      clearReconnect()
      setStatus((current) => (current === "connected" ? current : "connecting"))

      const ws = new WebSocket(getTicketsWebSocketUrl(ticketId))
      wsRef.current = ws

      ws.onopen = () => {
        retryCountRef.current = 0
        setStatus("connected")
        setNextRetryInMs(null)
      }

      ws.onmessage = (messageEvent) => {
        try {
          const parsed = JSON.parse(messageEvent.data) as TicketStreamEvent
          onEvent?.(parsed)
        } catch {
          // Ignore malformed payloads from stream to keep client resilient.
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (!unmountedRef.current) {
          scheduleReconnect()
        } else {
          setStatus("disconnected")
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      unmountedRef.current = true
      clearReconnect()
      closeSocket()
      setStatus("disconnected")
    }
  }, [ticketId, onEvent])

  return {
    status,
    nextRetryInMs,
  }
}
