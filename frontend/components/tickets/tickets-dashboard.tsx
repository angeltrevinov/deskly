"use client"

import { useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type OnChangeFn, type SortingState } from "@tanstack/react-table"

import { DashboardFilters } from "@/components/tickets/dashboard-filters"
import { DashboardPagination } from "@/components/tickets/dashboard-pagination"
import { DashboardSkeleton } from "@/components/tickets/dashboard-skeleton"
import { DashboardTable } from "@/components/tickets/dashboard-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTicketStream } from "@/hooks/useTicketStream"
import { type SortOrder, type Ticket, type TicketSortBy } from "@/lib/api"

type DashboardQuery = {
  estado?: string
  prioridad?: string
  asignado_a?: string
  sort_by: TicketSortBy
  sort_order: SortOrder
  page: number
  limit: number
}

type TicketsDashboardProps = {
  initialTickets: Ticket[]
  initialQuery: DashboardQuery
  initialErrorMessage?: string | null
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const ALLOWED_SORT_BY: TicketSortBy[] = [
  "id",
  "estado",
  "prioridad",
  "asignado_a",
  "creado_en",
  "actualizado_en",
]
const ALLOWED_SORT_ORDER: SortOrder[] = ["asc", "desc"]

const TABLE_SORT_TO_API_SORT: Record<string, TicketSortBy> = {
  prioridad: "prioridad",
  estado: "estado",
  asignado_a: "asignado_a",
  creado_en: "creado_en",
  actualizado_en: "actualizado_en",
}

function statusMeta(status: ReturnType<typeof useTicketStream>["status"]) {
  if (status === "connected") {
    return { label: "Conectado", variant: "success" as const }
  }
  if (status === "reconnecting") {
    return { label: "Reconectando", variant: "warning" as const }
  }
  if (status === "disconnected") {
    return { label: "Desconectado", variant: "error" as const }
  }
  return { label: "Conectando", variant: "neutral" as const }
}

export function TicketsDashboard({
  initialTickets,
  initialQuery,
  initialErrorMessage = null,
}: TicketsDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const tickets = initialTickets
  const errorMessage = initialErrorMessage ?? null

  const query = useMemo<DashboardQuery>(() => {
    const parsedPage = Number(searchParams.get("page") ?? initialQuery.page)
    const parsedLimit = Number(searchParams.get("limit") ?? initialQuery.limit)
    const rawSortBy = searchParams.get("sort_by")
    const rawSortOrder = searchParams.get("sort_order")

    const sort_by =
      rawSortBy && ALLOWED_SORT_BY.includes(rawSortBy as TicketSortBy)
        ? (rawSortBy as TicketSortBy)
        : initialQuery.sort_by
    const sort_order =
      rawSortOrder && ALLOWED_SORT_ORDER.includes(rawSortOrder as SortOrder)
        ? (rawSortOrder as SortOrder)
        : initialQuery.sort_order

    return {
      estado: searchParams.get("estado") ?? undefined,
      prioridad: searchParams.get("prioridad") ?? undefined,
      asignado_a: searchParams.get("asignado_a") ?? undefined,
      sort_by,
      sort_order,
      page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : initialQuery.page,
      limit:
        Number.isFinite(parsedLimit) && PAGE_SIZE_OPTIONS.includes(parsedLimit)
          ? parsedLimit
          : initialQuery.limit,
    }
  }, [initialQuery.limit, initialQuery.page, initialQuery.sort_by, initialQuery.sort_order, searchParams])

  const onStreamEvent = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router, startTransition])

  const { status, nextRetryInMs } = useTicketStream({ onEvent: onStreamEvent })

  const connection = statusMeta(status)
  const totalTicketsInView = tickets.length
  const openTicketsInView = tickets.filter((ticket) => ticket.estado === "abierto").length
  const highPriorityInView = tickets.filter((ticket) => ticket.prioridad === "alta").length
  const canGoNext = tickets.length >= query.limit

  const pushQuery = useCallback(
    (nextQuery: DashboardQuery) => {
      const params = new URLSearchParams()

      if (nextQuery.estado) {
        params.set("estado", nextQuery.estado)
      }
      if (nextQuery.prioridad) {
        params.set("prioridad", nextQuery.prioridad)
      }
      if (nextQuery.asignado_a) {
        params.set("asignado_a", nextQuery.asignado_a)
      }
      params.set("sort_by", nextQuery.sort_by)
      params.set("sort_order", nextQuery.sort_order)
      params.set("page", String(nextQuery.page))
      params.set("limit", String(nextQuery.limit))

      if (params.toString() === searchParams.toString()) {
        return
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams, startTransition]
  )

  const updateQuery = useCallback(
    (patch: Partial<DashboardQuery>) => {
      pushQuery({
        ...query,
        ...patch,
        page: 1,
      })
    },
    [pushQuery, query]
  )

  const goToPage = (page: number) => {
    pushQuery({ ...query, page: Math.max(1, page) })
  }

  const openTicket = useCallback(
    (ticketId: string) => {
      const queryString = searchParams.toString()

      startTransition(() => {
        router.push(queryString ? `/tickets/${ticketId}?${queryString}` : `/tickets/${ticketId}`)
      })
    },
    [router, searchParams, startTransition]
  )

  const tableSorting = useMemo<SortingState>(() => {
    if (query.sort_by === "prioridad") {
      return [{ id: "prioridad", desc: query.sort_order === "desc" }]
    }
    if (query.sort_by === "estado") {
      return [{ id: "estado", desc: query.sort_order === "desc" }]
    }
    if (query.sort_by === "asignado_a") {
      return [{ id: "asignado_a", desc: query.sort_order === "desc" }]
    }
    if (query.sort_by === "actualizado_en") {
      return [{ id: "actualizado_en", desc: query.sort_order === "desc" }]
    }
    if (query.sort_by === "creado_en") {
      return [{ id: "creado_en", desc: query.sort_order === "desc" }]
    }
    return []
  }, [query.sort_by, query.sort_order])

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const nextSorting = typeof updater === "function" ? updater(tableSorting) : updater
      const firstSort = nextSorting[0]

      if (!firstSort) {
        pushQuery({
          ...query,
          sort_by: "creado_en",
          sort_order: "desc",
          page: 1,
        })
        return
      }

      const mappedSortBy = TABLE_SORT_TO_API_SORT[firstSort.id] ?? "creado_en"
      pushQuery({
        ...query,
        sort_by: mappedSortBy,
        sort_order: firstSort.desc ? "desc" : "asc",
        page: 1,
      })
    },
    [pushQuery, query, tableSorting]
  )

  return (
    <Card className="border-border/70 bg-background/85 py-3 shadow-sm backdrop-blur">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Dashboard de tickets</CardTitle>
            <CardDescription>
              Encuentra y organiza tickets en segundos para priorizar mejor el trabajo del equipo.
            </CardDescription>
          </div>
          <Badge variant={connection.variant}>
            {connection.label}
            {status === "reconnecting" && nextRetryInMs !== null ? ` · reintento en ${Math.ceil(nextRetryInMs / 1000)}s` : ""}
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">En vista</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{totalTicketsInView}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Abiertos</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{openTicketsInView}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Prioridad alta</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{highPriorityInView}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DashboardFilters
          estado={query.estado}
          prioridad={query.prioridad}
          asignadoA={query.asignado_a}
          onEstadoChange={(value) => updateQuery({ estado: value })}
          onPrioridadChange={(value) => updateQuery({ prioridad: value })}
          onAsignadoChange={(value) => updateQuery({ asignado_a: value })}
          onClear={() =>
            pushQuery({
              sort_by: "creado_en",
              sort_order: "desc",
              page: 1,
              limit: 20,
            })
          }
        />

        {isPending && tickets.length === 0 ? <DashboardSkeleton /> : null}

        {!isPending && errorMessage && tickets.length === 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {!isPending && !errorMessage && tickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No hay tickets para los filtros actuales. Prueba con otros criterios.
          </div>
        ) : null}

        {tickets.length > 0 ? (
          <div className="space-y-3">
            {isPending ? (
              <p className="text-xs font-medium text-muted-foreground">Actualizando resultados...</p>
            ) : null}
            {errorMessage ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Error al actualizar: {errorMessage}
              </p>
            ) : null}
            <DashboardTable
              tickets={tickets}
              sorting={tableSorting}
              onSortingChange={onSortingChange}
              onTicketSelect={openTicket}
            />
          </div>
        ) : null}

        <DashboardPagination
          page={query.page}
          limit={query.limit}
          canGoNext={canGoNext}
          isPending={isPending}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onLimitChange={(value) => {
            if (PAGE_SIZE_OPTIONS.includes(value)) {
              updateQuery({ limit: value })
            }
          }}
          onPreviousPage={() => goToPage(query.page - 1)}
          onNextPage={() => goToPage(query.page + 1)}
        />
      </CardContent>
    </Card>
  )
}

export type { DashboardQuery }
