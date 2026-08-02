import { act, renderHook } from "@testing-library/react"

import { useTicketStream } from "@/hooks/useTicketStream"

class MockWebSocket {
  static instances: MockWebSocket[] = []

  public readonly url: string
  public close = jest.fn()
  public onopen: (() => void) | null = null
  public onmessage: ((event: { data: string }) => void) | null = null
  public onclose: (() => void) | null = null
  public onerror: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }
}

describe("useTicketStream", () => {
  const originalWebSocket = global.WebSocket

  beforeEach(() => {
    jest.useFakeTimers()
    MockWebSocket.instances = []
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket
  })

  afterEach(() => {
    global.WebSocket = originalWebSocket
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it("connects, reconnects with backoff and cleans up socket on unmount", () => {
    const onEvent = jest.fn()
    const { result, unmount } = renderHook(() => useTicketStream({ onEvent }))

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0]?.url).toContain("/api/tickets/ws/tickets")
    expect(result.current.status).toBe("connecting")

    act(() => {
      MockWebSocket.instances[0]?.onopen?.()
    })

    expect(result.current.status).toBe("connected")

    act(() => {
      MockWebSocket.instances[0]?.onclose?.()
    })

    expect(result.current.status).toBe("reconnecting")
    expect(result.current.nextRetryInMs).toBe(1000)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(MockWebSocket.instances).toHaveLength(2)

    act(() => {
      MockWebSocket.instances[1]?.onmessage?.({
        data: JSON.stringify({
          event: "ticket.actualizado",
          ticket_id: 12,
          payload: { id: 12, titulo: "A", descripcion: null, prioridad: "media", estado: "abierto", asignado_a: null, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() },
          emitted_at: new Date().toISOString(),
        }),
      })
    })

    expect(onEvent).toHaveBeenCalledTimes(1)

    unmount()
    expect(MockWebSocket.instances[1]?.close).toHaveBeenCalled()
  })
})
