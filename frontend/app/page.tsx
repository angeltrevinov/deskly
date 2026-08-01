import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTickets, type Ticket } from "@/lib/api"

export const dynamic = "force-dynamic"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-background/70 px-4 py-3 transition hover:border-border hover:bg-background"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{ticket.titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado: {ticket.estado} · Prioridad: {ticket.prioridad}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        <p>ID {ticket.id}</p>
        <p>{formatDate(ticket.actualizado_en)}</p>
      </div>
    </Link>
  )
}

export default async function Page() {
  let tickets: Ticket[] = []
  let errorMessage: string | null = null

  try {
    tickets = await getTickets()
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudo cargar el backend"
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,var(--color-muted)_0%,transparent_38%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklch,var(--color-background)_88%,var(--color-muted)_12%)_100%)] p-6 md:p-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Deskly API contract
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Tipos compartidos desde OpenAPI, listos para consumir en el frontend.
          </h1>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            El backend FastAPI expone el contrato, el frontend genera tipos TypeScript desde ese
            esquema y esta página los usa para leer tickets reales sin declarar modelos duplicados.
          </p>
        </section>

        <Card className="border-border/70 bg-background/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Tickets actuales</CardTitle>
            <CardDescription>
              Vista tipada con respuesta generada desde <code>/openapi.json</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {errorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : tickets.length > 0 ? (
              <div className="grid gap-3">
                {tickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No hay tickets todavía. Cuando el backend devuelva datos, aparecerán aquí con tipos
                compartidos.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
