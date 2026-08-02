import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TicketDetailErrorStateProps = {
  title?: string
  message: string
}

export function TicketDetailErrorState({
  title = "No se pudo cargar el ticket",
  message,
}: TicketDetailErrorStateProps) {
  return (
    <Card className="border-destructive/30 bg-background/85 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-destructive">{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}