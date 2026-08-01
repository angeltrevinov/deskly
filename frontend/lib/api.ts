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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function buildApiUrl(pathname: string) {
  return new URL(`/api${pathname}`, apiBaseUrl)
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

export function getTickets(): Promise<
  paths["/api/tickets"]["get"]["responses"][200]["content"]["application/json"]
> {
  return apiRequest("/tickets")
}