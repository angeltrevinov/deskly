import { render, screen } from "@testing-library/react"

import { TicketsDashboard, type DashboardQuery } from "@/components/tickets/tickets-dashboard"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
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
})
