import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TicketCommentRead } from "@/lib/api"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

type TicketCommentsTimelineProps = {
  comments: TicketCommentRead[]
}

export function TicketCommentsTimeline({ comments }: TicketCommentsTimelineProps) {
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