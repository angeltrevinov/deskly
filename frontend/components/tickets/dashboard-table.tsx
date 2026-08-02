import { useMemo } from "react"
import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Ticket } from "@/lib/api"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <ArrowUp className="ml-1 size-3.5" aria-label="Orden ascendente" />
  }
  if (direction === "desc") {
    return <ArrowDown className="ml-1 size-3.5" aria-label="Orden descendente" />
  }
  return <ArrowUpDown className="ml-1 size-3.5" aria-label="Sin orden" />
}

type DashboardTableProps = {
  tickets: Ticket[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

export function DashboardTable({ tickets, sorting, onSortingChange }: DashboardTableProps) {
  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: "titulo",
        header: "Título",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="text-sm font-semibold text-foreground">{row.original.titulo}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">ID {row.original.id}</p>
          </div>
        ),
      },
      {
        id: "prioridad",
        accessorKey: "prioridad",
        header: ({ column }) => {
          const sortDirection = column.getIsSorted()
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-0 text-xs font-semibold uppercase tracking-[0.12em] hover:text-foreground ${
                sortDirection ? "text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Prioridad
              <SortIcon direction={sortDirection} />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-sm font-medium capitalize text-foreground">{row.original.prioridad}</span>
        ),
      },
      {
        id: "estado",
        accessorKey: "estado",
        header: ({ column }) => {
          const sortDirection = column.getIsSorted()
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-0 text-xs font-semibold uppercase tracking-[0.12em] hover:text-foreground ${
                sortDirection ? "text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Estado
              <SortIcon direction={sortDirection} />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-sm font-medium capitalize text-foreground">{row.original.estado}</span>
        ),
      },
      {
        id: "asignado_a",
        accessorFn: (row) => row.asignado_a ?? "",
        header: ({ column }) => {
          const sortDirection = column.getIsSorted()
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-0 text-xs font-semibold uppercase tracking-[0.12em] hover:text-foreground ${
                sortDirection ? "text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Asignado a
              <SortIcon direction={sortDirection} />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.asignado_a ?? "Sin asignar"}</span>
        ),
      },
      {
        id: "creado_en",
        accessorFn: (row) => row.creado_en,
        header: ({ column }) => {
          const sortDirection = column.getIsSorted()
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 px-0 text-xs font-semibold uppercase tracking-[0.12em] hover:text-foreground ${
                  sortDirection ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Creado en
                <SortIcon direction={sortDirection} />
              </Button>
            </div>
          )
        },
        cell: ({ row }) => (
          <p className="text-right text-sm text-muted-foreground">{formatDate(row.original.creado_en)}</p>
        ),
      },
      {
        id: "actualizado_en",
        accessorFn: (row) => row.actualizado_en,
        header: ({ column }) => {
          const sortDirection = column.getIsSorted()
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 px-0 text-xs font-semibold uppercase tracking-[0.12em] hover:text-foreground ${
                  sortDirection ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Actualizado en
                <SortIcon direction={sortDirection} />
              </Button>
            </div>
          )
        },
        cell: ({ row }) => (
          <p className="text-right text-sm text-muted-foreground">{formatDate(row.original.actualizado_en)}</p>
        ),
      },
    ],
    []
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange,
    state: {
      sorting,
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background/70">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.id === "creado_en" || header.id === "actualizado_en" ? "text-right" : undefined
                  }
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
