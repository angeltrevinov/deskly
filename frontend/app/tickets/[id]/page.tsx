import Link from "next/link"
import { notFound } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError, getTicket, getTicketComments, type Ticket, type TicketCommentRead } from "@/lib/api"

export const dynamic = "force-dynamic"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function CommentRow({ comment }: { comment: TicketCommentRead }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-foreground">{comment.autor ?? "Sin autor"}</p>
        <p className="text-xs text-muted-foreground">{formatDate(comment.creado_en)}</p>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {comment.contenido}
      </p>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  )
}

async function TicketDetail({ ticketId }: { ticketId: number }) {
  const [ticket, comments] = await Promise.all([
    getTicket(ticketId),
    getTicketComments(ticketId, { limit: 100 }),
  ])

  return (
    <div className="grid gap-6">
      <Card className="border-border/70 bg-background/80 shadow-sm backdrop-blur">
        <CardHeader>
          <CardDescription>Ticket #{ticket.id}</CardDescription>
          <CardTitle className="text-2xl md:text-3xl">{ticket.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Estado" value={ticket.estado} />
            <DetailField label="Prioridad" value={ticket.prioridad} />
            <DetailField label="Asignado a" value={ticket.asignado_a ?? "Sin asignar"} />
            <DetailField label="Actualizado" value={formatDate(ticket.actualizado_en)} />
          </div>

          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Descripción
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">
              {ticket.descripcion ?? "Sin descripción"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/80 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Comentarios</CardTitle>
          <CardDescription>
            {comments.length > 0
              ? `${comments.length} comentario${comments.length === 1 ? "" : "s"} cargados desde SSR`
              : "Todavía no hay comentarios en este ticket"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => <CommentRow key={comment.id} comment={comment} />)
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Cuando existan comentarios, aparecerán aquí en el render del servidor.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">No se pudo cargar el ticket</CardTitle>
        <CardDescription className="text-destructive/80">{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ticketId = Number(id)

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    notFound()
  }

  let errorMessage: string | null = null

  try {
    return (
      <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,var(--color-muted)_0%,transparent_38%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklch,var(--color-background)_88%,var(--color-muted)_12%)_100%)] p-6 md:p-10">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              ← Volver al listado
            </Link>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Deskly ticket detail
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Detalle SSR con comentarios del ticket.
            </h1>
          </section>

          <TicketDetail ticketId={ticketId} />
        </main>
      </div>
    )
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound()
    }

    errorMessage =
      error instanceof Error ? error.message : "Ocurrió un error al consultar el backend"
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,var(--color-muted)_0%,transparent_38%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklch,var(--color-background)_88%,var(--color-muted)_12%)_100%)] p-6 md:p-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Volver al listado
          </Link>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Deskly ticket detail
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Detalle SSR con comentarios del ticket.
          </h1>
        </section>

        <ErrorState message={errorMessage} />
      </main>
    </div>
  )
}
