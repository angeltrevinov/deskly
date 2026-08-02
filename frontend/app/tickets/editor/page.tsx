import Link from "next/link"
import { notFound } from "next/navigation"

import { TicketDetailErrorState } from "@/components/tickets/ticket-detail-error-state"
import { TicketEditorWorkbench } from "@/components/tickets/ticket-editor-workbench"
import { getTicket, listTicketComments, type Ticket, type TicketCommentRead } from "@/lib/api"

export const dynamic = "force-dynamic"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PageSearchParams = Record<string, string | string[] | undefined>

type PageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function TicketEditorPage({ searchParams }: PageProps) {
  const resolvedParams = (await Promise.resolve(searchParams ?? {})) as PageSearchParams
  const ticketId = firstParam(resolvedParams.id)

  if (ticketId && !UUID_PATTERN.test(ticketId)) {
    notFound()
  }

  let ticket: Ticket | null = null
  let comments: TicketCommentRead[] = []
  let ticketErrorMessage: string | null = null
  let commentsErrorMessage: string | null = null

  if (ticketId) {
    try {
      ticket = await getTicket(ticketId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar el ticket para edición"
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
              {ticketId ? "Editar ticket" : "Crear ticket"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Usa esta ruta para crear tickets nuevos o editar uno existente pasando su id por query param.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Volver al dashboard
          </Link>
        </div>

        {ticketErrorMessage ? <TicketDetailErrorState message={ticketErrorMessage} /> : null}

        {!ticketErrorMessage ? (
          <TicketEditorWorkbench
            initialTicket={ticket}
            initialComments={comments}
            initialCommentsError={commentsErrorMessage}
          />
        ) : null}
      </main>
    </div>
  )
}
