import { TicketsDashboard, type DashboardQuery } from "@/components/tickets/tickets-dashboard"
import {
  listTickets,
  type ListTicketsQuery,
  type SortOrder,
  type Ticket,
  type TicketSortBy,
} from "@/lib/api"

export const dynamic = "force-dynamic"

type PageSearchParams = Record<string, string | string[] | undefined>

type PageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams
}

const ALLOWED_SORT_BY: TicketSortBy[] = [
  "id",
  "estado",
  "prioridad",
  "asignado_a",
  "creado_en",
  "actualizado_en",
]
const ALLOWED_SORT_ORDER: SortOrder[] = ["asc", "desc"]

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseNumber(value: string | undefined, fallback: number, min = 1) {
  if (value === undefined) {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback
  }
  return parsed
}

function parseDashboardQuery(searchParams: PageSearchParams): DashboardQuery {
  const page = parseNumber(firstParam(searchParams.page), 1)
  const limit = parseNumber(firstParam(searchParams.limit), 20)

  const sortBy = firstParam(searchParams.sort_by)
  const sortOrder = firstParam(searchParams.sort_order)
  const normalizedSortBy =
    sortBy && ALLOWED_SORT_BY.includes(sortBy as TicketSortBy)
      ? (sortBy as TicketSortBy)
      : "creado_en"
  const normalizedSortOrder =
    sortOrder && ALLOWED_SORT_ORDER.includes(sortOrder as SortOrder)
      ? (sortOrder as SortOrder)
      : "desc"

  return {
    estado: firstParam(searchParams.estado) || undefined,
    prioridad: firstParam(searchParams.prioridad) || undefined,
    asignado_a: firstParam(searchParams.asignado_a) || undefined,
    sort_by: normalizedSortBy,
    sort_order: normalizedSortOrder,
    page,
    limit: [10, 20, 50].includes(limit) ? limit : 20,
  }
}

function toListQuery(query: DashboardQuery): ListTicketsQuery {
  return {
    offset: (query.page - 1) * query.limit,
    limit: query.limit,
    estado: query.estado,
    prioridad: query.prioridad,
    asignado_a: query.asignado_a,
    sort_by: query.sort_by,
    sort_order: query.sort_order,
  }
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = (await Promise.resolve(searchParams ?? {})) as PageSearchParams
  const initialQuery = parseDashboardQuery(resolvedParams)

  let tickets: Ticket[] = []
  let errorMessage: string | null = null

  try {
    tickets = await listTickets(toListQuery(initialQuery))
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudo cargar el backend"
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_10%_0%,color-mix(in_oklch,var(--color-chart-1)_40%,transparent)_0%,transparent_34%),radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--color-chart-2)_28%,transparent)_0%,transparent_36%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklch,var(--color-background)_90%,var(--color-muted)_10%)_100%)] p-4 md:p-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-border/70 bg-background/75 p-5 shadow-sm backdrop-blur md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Deskly Ticket Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Centro de tickets
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            Busca, filtra y ordena casos para dar seguimiento rapido a cada solicitud del equipo y de tus clientes.
          </p>
        </section>

        <TicketsDashboard initialTickets={tickets} initialQuery={initialQuery} initialErrorMessage={errorMessage} />
      </main>
    </div>
  )
}
