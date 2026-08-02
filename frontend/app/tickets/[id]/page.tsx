import Link from "next/link"
import { notFound } from "next/navigation"

import { TicketDetailErrorState } from "@/components/tickets/ticket-detail-error-state"
import { TicketDetailWorkbench } from "@/components/tickets/ticket-detail-workbench"
import { getTicket, listTicketComments, type Ticket, type TicketCommentRead } from "@/lib/api"

export const dynamic = "force-dynamic"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PageProps = {
  params?: Promise<{ id: string }> | { id: string }
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function TicketDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = (await Promise.resolve(params)) as { id?: string } | undefined
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const ticketId = resolvedParams?.id
  const backParams = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    const normalizedValue = firstParam(value)
    if (normalizedValue) {
      backParams.set(key, normalizedValue)
    }
  }

  const backHref = backParams.size > 0 ? `/?${backParams.toString()}` : "/"

  if (!ticketId || !UUID_PATTERN.test(ticketId)) {
    notFound()
  }

  let ticket: Ticket | null = null
  let comments: TicketCommentRead[] = []
  let ticketErrorMessage: string | null = null
  let commentsErrorMessage: string | null = null

  try {
    ticket = await getTicket(ticketId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el detalle del ticket"
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("no encontrado")) {
      notFound()
    }
    ticketErrorMessage = message
  }

  if (ticket) {
    try {
      comments = await listTicketComments(ticketId, { limit: 50, offset: 0 })
    } catch (error) {
      commentsErrorMessage =
        error instanceof Error ? error.message : "No se pudieron cargar los comentarios del ticket"
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_10%_0%,color-mix(in_oklch,var(--color-chart-1)_34%,transparent)_0%,transparent_34%),radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--color-chart-2)_24%,transparent)_0%,transparent_36%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklch,var(--color-background)_90%,var(--color-muted)_10%)_100%)] p-4 md:p-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Deskly Ticket Center
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Detalle del ticket
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/tickets/editor?id=${ticketId}`}
              className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border/60 bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Editar en formulario
            </Link>
            <Link
              href={backHref}
              className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>

        {ticketErrorMessage ? <TicketDetailErrorState message={ticketErrorMessage} /> : null}
        {ticket ? (
          <TicketDetailWorkbench
            ticketId={ticketId}
            initialTicket={ticket}
            initialComments={comments}
            initialCommentsError={commentsErrorMessage}
          />
        ) : null}
      </main>
    </div>
  )
}
