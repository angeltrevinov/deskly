import type { components, paths } from "@/lib/deskly-api"

export type Ticket = components["schemas"]["TicketRead"]
export type TicketCreate = components["schemas"]["TicketCreate"]
export type TicketUpdate = components["schemas"]["TicketUpdate"]
export type TicketCommentRead = components["schemas"]["TicketCommentRead"]
export type TicketCommentCreate = components["schemas"]["TicketCommentCreate"]
export type TicketStateTransition = components["schemas"]["TicketStateTransition"]
export type TicketStateTransitionConflict = components["schemas"]["TicketStateTransitionConflict"]
export type WebhookTicketIngestRequest = components["schemas"]["WebhookTicketIngestRequest"]
export type WebhookTicketPayload = components["schemas"]["WebhookTicketPayload"]
export type TicketSortBy = components["schemas"]["TicketSortBy"]
export type SortOrder = components["schemas"]["SortOrder"]

export type ListTicketsQuery = NonNullable<
  paths["/api/tickets"]["get"]["parameters"]["query"]
>
export type ListTicketCommentsQuery = NonNullable<
  paths["/api/tickets/{ticket_id}/comentarios"]["get"]["parameters"]["query"]
>

const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const serverApiBaseUrl = process.env.SERVER_API_URL ?? publicApiBaseUrl

function buildApiUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return `/api${pathname}`
  }

  return new URL(`/api${pathname}`, serverApiBaseUrl)
}

function toWsBaseUrl(url: string) {
  return url.replace(/^http:/, "ws:").replace(/^https:/, "wss:")
}

async function readApiError(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as {
        detail?: string
        mensaje?: string
        error?: string
      }

      if (typeof body.detail === "string" && body.detail.length > 0) {
        return body.detail
      }
      if (typeof body.mensaje === "string" && body.mensaje.length > 0) {
        return body.mensaje
      }
      if (typeof body.error === "string" && body.error.length > 0) {
        return body.error
      }
    } catch {
      return null
    }
  }

  return null
}

async function apiRequest<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(pathname), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await readApiError(response)
    throw new Error(detail ?? `API request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export function listTickets(query?: ListTicketsQuery): Promise<
  paths["/api/tickets"]["get"]["responses"][200]["content"]["application/json"]
> {
  const endpoint = new URL("/tickets", "http://internal")

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        endpoint.searchParams.set(key, String(value))
      }
    }
  }

  return apiRequest(endpoint.pathname + endpoint.search)
}

export function getTickets() {
  return listTickets()
}

export function createTicket(payload: TicketCreate): Promise<
  paths["/api/tickets"]["post"]["responses"][201]["content"]["application/json"]
> {
  return apiRequest("/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function getTicket(ticketId: string): Promise<
  paths["/api/tickets/{ticket_id}"]["get"]["responses"][200]["content"]["application/json"]
> {
  return apiRequest(`/tickets/${ticketId}`)
}

export function listTicketComments(ticketId: string, query?: ListTicketCommentsQuery): Promise<
  paths["/api/tickets/{ticket_id}/comentarios"]["get"]["responses"][200]["content"]["application/json"]
> {
  const endpoint = new URL(`/tickets/${ticketId}/comentarios`, "http://internal")

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        endpoint.searchParams.set(key, String(value))
      }
    }
  }

  return apiRequest(endpoint.pathname + endpoint.search)
}

export function updateTicket(ticketId: string, payload: TicketUpdate): Promise<
  paths["/api/tickets/{ticket_id}"]["patch"]["responses"][200]["content"]["application/json"]
> {
  return apiRequest(`/tickets/${ticketId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function transitionTicketState(ticketId: string, payload: TicketStateTransition): Promise<
  paths["/api/tickets/{ticket_id}/transicion"]["post"]["responses"][200]["content"]["application/json"]
> {
  return apiRequest(`/tickets/${ticketId}/transicion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function addTicketComment(ticketId: string, payload: TicketCommentCreate): Promise<
  paths["/api/tickets/{ticket_id}/comentarios"]["post"]["responses"][201]["content"]["application/json"]
> {
  return apiRequest(`/tickets/${ticketId}/comentarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function getTicketsWebSocketUrl(ticketId?: string) {
  const wsUrl = new URL("/api/tickets/ws/tickets", toWsBaseUrl(publicApiBaseUrl))
  if (ticketId !== undefined) {
    wsUrl.searchParams.set("ticket_id", String(ticketId))
  }
  return wsUrl.toString()
}