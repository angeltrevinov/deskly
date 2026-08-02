import { getTicket, getTickets, listTicketComments } from "@/lib/api"

describe("getTickets", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    delete process.env.NEXT_PUBLIC_API_URL
  })

  it("returns parsed tickets when the API responds with 200", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
    const payload = [
      {
        id: 1,
        titulo: "Ticket de prueba",
        descripcion: "Detalle",
        estado: "abierto",
        prioridad: "alta",
        creado_en: "2026-08-01T10:00:00Z",
        actualizado_en: "2026-08-01T10:00:00Z",
      },
    ]

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response)

    await expect(getTickets()).resolves.toEqual(payload)
    expect(global.fetch).toHaveBeenCalledWith(
      new URL("/api/tickets", "http://localhost:8000"),
      expect.objectContaining({ cache: "no-store" })
    )
  })

  it("throws API detail message when response is not ok", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ detail: "Ticket no encontrado" }),
      status: 404,
    } as unknown as Response)

    await expect(getTickets()).rejects.toThrow("Ticket no encontrado")
  })

  it("requests a single ticket by id", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
    const payload = {
      id: 4,
      titulo: "Ticket detalle",
      descripcion: "Detalle",
      estado: "abierto",
      prioridad: "alta",
      asignado_a: null,
      creado_en: "2026-08-01T10:00:00Z",
      actualizado_en: "2026-08-01T10:00:00Z",
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response)

    await expect(getTicket(4)).resolves.toEqual(payload)
    expect(global.fetch).toHaveBeenCalledWith(
      new URL("/api/tickets/4", "http://localhost:8000"),
      expect.objectContaining({ cache: "no-store" })
    )
  })

  it("requests ticket comments with query params", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
    const payload = [
      {
        id: 1,
        ticket_id: 4,
        contenido: "Primer comentario",
        autor: "agente@deskly.io",
        creado_en: "2026-08-01T10:15:00Z",
      },
    ]

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response)

    await expect(listTicketComments(4, { offset: 0, limit: 50 })).resolves.toEqual(payload)
    expect(global.fetch).toHaveBeenCalledWith(
      new URL("/api/tickets/4/comentarios?offset=0&limit=50", "http://localhost:8000"),
      expect.objectContaining({ cache: "no-store" })
    )
  })
})
