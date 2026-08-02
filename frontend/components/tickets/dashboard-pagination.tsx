import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

type DashboardPaginationProps = {
  page: number
  limit: number
  canGoNext: boolean
  isPending: boolean
  pageSizeOptions: number[]
  onLimitChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function DashboardPagination({
  page,
  limit,
  canGoNext,
  isPending,
  pageSizeOptions,
  onLimitChange,
  onPreviousPage,
  onNextPage,
}: DashboardPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Tickets mostrados</p>
        <Select
          name="limit"
          value={String(limit)}
          className="h-8 w-[88px]"
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">Página {page}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPreviousPage} disabled={page <= 1 || isPending}>
          Anterior
        </Button>
        <Button type="button" size="sm" onClick={onNextPage} disabled={isPending || !canGoNext}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}
