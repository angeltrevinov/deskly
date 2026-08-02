import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTicket, listTicketComments, type Ticket, type TicketCommentRead } from "@/lib/api"

export const dynamic = "force-dynamic"

type PageProps = {
  params?: Promise<{ id: string }> | { id: string }
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ")
}

function priorityVariant(priority: string) {
  if (priority === "alta") {
    return "error" as const
  }
  if (priority === "media") {
    return "warning" as const
  }
  return "neutral" as const
}

function statusVariant(status: string) {
  if (status === "resuelto" || status === "cerrado") {
    return "success" as const
  }
  if (status === "reabierto") {
    return "warning" as const
  }
  if (status === "en_progreso") {
    return "neutral" as const
  }
  return "error" as const
}

function TicketSummary({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Ticket #{ticket.id}
            </p>
            <CardTitle className="text-2xl tracking-tight text-foreground md:text-3xl">
              {ticket.titulo}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 md:text-base">
              {ticket.descripcion ?? "Sin descripción registrada para este ticket."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(ticket.estado)}>{formatLabel(ticket.estado)}</Badge>
            <Badge variant={priorityVariant(ticket.prioridad)}>{ticket.prioridad}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Asignado a</p>
          <p className="mt-1 text-sm font-medium text-foreground">{ticket.asignado_a ?? "Sin asignar"}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Creado</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatDate(ticket.creado_en)}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Actualizado</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatDate(ticket.actualizado_en)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CommentsTimeline({ comments }: { comments: TicketCommentRead[] }) {
  return (
    <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">Comentarios</CardTitle>
        <CardDescription>Historial SSR de notas registradas para este ticket.</CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            Este ticket todavía no tiene comentarios.
          </div>
        ) : (
          <ol className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{comment.autor ?? "Sistema Deskly"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(comment.creado_en)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/90">{comment.contenido}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-background/85 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-destructive">No se pudo cargar el ticket</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default async function TicketDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = (await Promise.resolve(params)) as { id?: string } | undefined
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const ticketId = Number(resolvedParams?.id)
  const backParams = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    const normalizedValue = firstParam(value)
    if (normalizedValue) {
      backParams.set(key, normalizedValue)
    }
  }

  const backHref = backParams.size > 0 ? `/?${backParams.toString()}` : "/"

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    notFound()
  }

  let ticket: Ticket | null = null
  let comments: TicketCommentRead[] = []
  let errorMessage: string | null = null

  try {
    ;[ticket, comments] = await Promise.all([
      getTicket(ticketId),
      listTicketComments(ticketId, { limit: 50, offset: 0 }),
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el detalle del ticket"
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("no encontrado")) {
      notFound()
    }
    errorMessage = message
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
          <Link
            href={backHref}
            className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Volver al dashboard
          </Link>
        </div>

        {errorMessage ? <ErrorState message={errorMessage} /> : null}
        {ticket ? <TicketSummary ticket={ticket} /> : null}
        {ticket && !errorMessage ? <CommentsTimeline comments={comments} /> : null}
      </main>
    </div>
  )
}