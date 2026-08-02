import { Card, CardContent } from "@/components/ui/card"
import type { Ticket } from "@/lib/api"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

type TicketCardProps = {
  ticket: Ticket
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Card className="border-border/70 bg-background/80 py-0">
      <CardContent className="grid gap-3 px-4 py-3 sm:grid-cols-[1.25fr_auto_auto] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{ticket.titulo}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {ticket.descripcion ?? "Sin descripción"}
          </p>
        </div>
        <div className="text-xs text-muted-foreground sm:text-sm">
          <p>
            Estado: <span className="font-medium text-foreground">{ticket.estado}</span>
          </p>
          <p>
            Prioridad: <span className="font-medium text-foreground">{ticket.prioridad}</span>
          </p>
        </div>
        <div className="text-left text-xs text-muted-foreground sm:text-right">
          <p>ID {ticket.id}</p>
          <p>{formatDate(ticket.actualizado_en)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
