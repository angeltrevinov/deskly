import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Ticket } from "@/lib/api"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
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

type TicketSummaryProps = {
  ticket: Ticket
}

export function TicketSummary({ ticket }: TicketSummaryProps) {
  return (
    <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ticket</p>
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