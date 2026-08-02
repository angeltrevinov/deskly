import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TicketsDashboard, type DashboardQuery } from "@/components/tickets/tickets-dashboard"

const push = jest.fn()
const searchParams = new URLSearchParams("estado=en_progreso&prioridad=media&sort_by=estado&sort_order=asc&page=1&limit=10")

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}))

jest.mock("@/hooks/useTicketStream", () => ({
  useTicketStream: () => ({ status: "connected", nextRetryInMs: null }),
}))

describe("TicketsDashboard", () => {
  const initialQuery: DashboardQuery = {
    sort_by: "creado_en",
    sort_order: "desc",
    page: 1,
    limit: 20,
  }

  beforeEach(() => {
    push.mockReset()
  })

  it("renders empty state when there are no tickets", () => {
    render(<TicketsDashboard initialTickets={[]} initialQuery={initialQuery} initialErrorMessage={null} />)

    expect(screen.getByText("No hay tickets para los filtros actuales. Prueba con otros criterios.")).toBeInTheDocument()
  })

  it("renders error state when initial request fails", () => {
    render(
      <TicketsDashboard
        initialTickets={[]}
        initialQuery={initialQuery}
        initialErrorMessage="No se pudo cargar"
      />
    )

    expect(screen.getByText("No se pudo cargar")).toBeInTheDocument()
  })

  it("navigates to ticket detail from the accessible button in the first cell", async () => {
    const user = userEvent.setup()

    render(
      <TicketsDashboard
        initialTickets={[
          {
            id: "9f9f4f40-39d7-4d02-9ba1-9836c5db7f4d",
            titulo: "Consulta de facturación duplicada",
            descripcion: "Detalle del ticket",
            estado: "en_progreso",
            prioridad: "media",
            asignado_a: "finanzas@deskly.io",
            creado_en: "2026-08-01T10:00:00Z",
            actualizado_en: "2026-08-01T10:30:00Z",
          },
        ]}
        initialQuery={initialQuery}
        initialErrorMessage={null}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Ver detalle de Consulta de facturación duplicada" })
    )

    expect(push).toHaveBeenCalledWith(
      "/tickets/9f9f4f40-39d7-4d02-9ba1-9836c5db7f4d?estado=en_progreso&prioridad=media&sort_by=estado&sort_order=asc&page=1&limit=10"
    )
  })
})
