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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function buildApiUrl(pathname: string) {
  return new URL(`/api${pathname}`, apiBaseUrl)
}

function toWsBaseUrl(url: string) {
  return url.replace(/^http:/, "ws:").replace(/^https:/, "wss:")
}

async function readApiError(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as { detail?: string }
      if (typeof body.detail === "string" && body.detail.length > 0) {
        return body.detail
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

export function getTicketsWebSocketUrl(ticketId?: number) {
  const wsUrl = new URL("/api/tickets/ws/tickets", toWsBaseUrl(apiBaseUrl))
  if (ticketId !== undefined) {
    wsUrl.searchParams.set("ticket_id", String(ticketId))
  }
  return wsUrl.toString()
}