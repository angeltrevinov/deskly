import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

type DashboardFiltersProps = {
  estado?: string
  prioridad?: string
  asignadoA?: string
  onEstadoChange: (value: string | undefined) => void
  onPrioridadChange: (value: string | undefined) => void
  onAsignadoChange: (value: string | undefined) => void
  onClear: () => void
}

export function DashboardFilters({
  estado,
  prioridad,
  asignadoA,
  onEstadoChange,
  onPrioridadChange,
  onAsignadoChange,
  onClear,
}: DashboardFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/25 p-3 md:grid-cols-6 md:p-4">
      <label className="grid gap-1 md:col-span-1">
        <span className="text-xs font-medium text-muted-foreground">Estado</span>
        <Select name="estado" value={estado ?? ""} onChange={(event) => onEstadoChange(event.target.value || undefined)}>
          <option value="">Todos</option>
          <option value="abierto">Abierto</option>
          <option value="en_progreso">En progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
          <option value="reabierto">Reabierto</option>
        </Select>
      </label>

      <label className="grid gap-1 md:col-span-1">
        <span className="text-xs font-medium text-muted-foreground">Prioridad</span>
        <Select
          name="prioridad"
          value={prioridad ?? ""}
          onChange={(event) => onPrioridadChange(event.target.value || undefined)}
        >
          <option value="">Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </Select>
      </label>

      <label className="grid gap-1 md:col-span-1">
        <span className="text-xs font-medium text-muted-foreground">Asignado</span>
        <Input
          name="asignado_a"
          value={asignadoA ?? ""}
          placeholder="usuario@deskly"
          onChange={(event) => onAsignadoChange(event.target.value || undefined)}
        />
      </label>

      <div className="md:col-span-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onClear}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}
