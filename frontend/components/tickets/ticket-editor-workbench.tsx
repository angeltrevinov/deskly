"use client"

import Link from "next/link"
import { type FormEvent, useMemo, useState } from "react"

import { TicketCommentsTimeline } from "@/components/tickets/ticket-comments-timeline"
import { TicketDetailErrorState } from "@/components/tickets/ticket-detail-error-state"
import { TicketSummary } from "@/components/tickets/ticket-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  addTicketComment,
  createTicket,
  type Ticket,
  type TicketCommentCreate,
  type TicketCommentRead,
  type TicketCreate,
  type TicketStateTransition,
  type TicketUpdate,
  transitionTicketState,
  updateTicket,
} from "@/lib/api"

type TicketEditorWorkbenchProps = {
  initialTicket: Ticket | null
  initialComments: TicketCommentRead[]
  initialCommentsError?: string | null
}

type TicketDraft = {
  titulo: string
  descripcion: string
  prioridad: string
  asignado_a: string
}

const EMPTY_DRAFT: TicketDraft = {
  titulo: "",
  descripcion: "",
  prioridad: "media",
  asignado_a: "",
}

function createDraftFromTicket(ticket: Ticket): TicketDraft {
  return {
    titulo: ticket.titulo,
    descripcion: ticket.descripcion ?? "",
    prioridad: ticket.prioridad,
    asignado_a: ticket.asignado_a ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatStateLabel(value: string) {
  return value.replaceAll("_", " ")
}

export function TicketEditorWorkbench({
  initialTicket,
  initialComments,
  initialCommentsError = null,
}: TicketEditorWorkbenchProps) {
  const [ticket, setTicket] = useState<Ticket | null>(initialTicket)
  const [comments, setComments] = useState(initialComments)
  const [draft, setDraft] = useState<TicketDraft>(
    initialTicket ? createDraftFromTicket(initialTicket) : EMPTY_DRAFT
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(initialCommentsError)
  const [commentContent, setCommentContent] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("")
  const [transitionState, setTransitionState] = useState(initialTicket?.estado ?? "abierto")

  const isEditMode = ticket !== null
  const isOptimisticTicket = ticket?.id.startsWith("optimistic-") ?? false
  const canComment = Boolean(ticket) && !isOptimisticTicket && !isSaving

  const priorityOptions = useMemo(() => {
    const baseOptions = ["alta", "media", "baja"]
    if (!baseOptions.includes(draft.prioridad)) {
      return [draft.prioridad, ...baseOptions]
    }
    return baseOptions
  }, [draft.prioridad])

  const stateOptions = useMemo(() => {
    const baseOptions = ["abierto", "en_progreso", "resuelto", "cerrado", "reabierto"]
    if (!baseOptions.includes(transitionState)) {
      return [transitionState, ...baseOptions]
    }
    return baseOptions
  }, [transitionState])

  const onSaveTicket = async () => {
    if (isSaving) {
      return
    }

    const titulo = draft.titulo.trim()
    if (!titulo) {
      setSaveError("El título es obligatorio")
      return
    }

    setSaveError(null)
    setIsSaving(true)

    if (!ticket) {
      const payload: TicketCreate = {
        titulo,
        descripcion: draft.descripcion.trim() ? draft.descripcion.trim() : null,
        prioridad: draft.prioridad,
        asignado_a: draft.asignado_a.trim() ? draft.asignado_a.trim() : null,
      }

      const optimisticTicket: Ticket = {
        id: `optimistic-${Date.now()}`,
        titulo: payload.titulo,
        descripcion: payload.descripcion ?? null,
        prioridad: payload.prioridad,
        estado: "abierto",
        asignado_a: payload.asignado_a ?? null,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      }

      setTicket(optimisticTicket)

      try {
        const created = await createTicket(payload)
        setTicket(created)
        setDraft(createDraftFromTicket(created))
        setTransitionState(created.estado)
      } catch (error) {
        setTicket(null)
        setSaveError(getErrorMessage(error, "No se pudo crear el ticket"))
      } finally {
        setIsSaving(false)
      }

      return
    }

    const previousTicket = ticket
    const payload: TicketUpdate = {
      titulo,
      descripcion: draft.descripcion.trim() ? draft.descripcion.trim() : null,
      prioridad: draft.prioridad,
      asignado_a: draft.asignado_a.trim() ? draft.asignado_a.trim() : null,
    }

    const optimisticTicket: Ticket = {
      ...ticket,
      titulo: payload.titulo ?? ticket.titulo,
      descripcion: payload.descripcion ?? null,
      prioridad: payload.prioridad ?? ticket.prioridad,
      asignado_a: payload.asignado_a ?? null,
      actualizado_en: new Date().toISOString(),
    }

    setTicket(optimisticTicket)

    try {
      const updated = await updateTicket(ticket.id, payload)
      setTicket(updated)
      setDraft(createDraftFromTicket(updated))
      setTransitionState(updated.estado)
    } catch (error) {
      setTicket(previousTicket)
      setSaveError(getErrorMessage(error, "No se pudo actualizar el ticket"))
    } finally {
      setIsSaving(false)
    }
  }

  const onTransitionTicket = async () => {
    if (!ticket || isTransitioning || transitionState === ticket.estado) {
      return
    }

    const previousTicket = ticket
    const payload: TicketStateTransition = {
      estado: transitionState,
    }

    const optimisticTicket: Ticket = {
      ...ticket,
      estado: payload.estado,
      actualizado_en: new Date().toISOString(),
    }

    setTransitionError(null)
    setTicket(optimisticTicket)
    setIsTransitioning(true)

    try {
      const updated = await transitionTicketState(ticket.id, payload)
      setTicket(updated)
      setTransitionState(updated.estado)
      setDraft(createDraftFromTicket(updated))
    } catch (error) {
      setTicket(previousTicket)
      setTransitionState(previousTicket.estado)
      setTransitionError(getErrorMessage(error, "No se pudo aplicar la transición"))
    } finally {
      setIsTransitioning(false)
    }
  }

  const onSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!ticket) {
      setCommentError("Primero guarda el ticket para poder comentar")
      return
    }

    if (isOptimisticTicket || isSaving) {
      setCommentError("Espera a que el ticket termine de guardarse para comentar")
      return
    }

    if (isCommenting) {
      return
    }

    const contenido = commentContent.trim()
    const autor = commentAuthor.trim()

    if (!contenido) {
      setCommentError("El comentario no puede estar vacío")
      return
    }

    const payload: TicketCommentCreate = {
      contenido,
      autor: autor.length > 0 ? autor : null,
    }

    const previousComments = comments
    const optimisticCommentId = `optimistic-${Date.now()}`
    const optimisticComment: TicketCommentRead = {
      id: optimisticCommentId,
      ticket_id: ticket.id,
      contenido,
      autor: payload.autor ?? null,
      creado_en: new Date().toISOString(),
    }

    setCommentError(null)
    setCommentContent("")
    setComments((current) => [optimisticComment, ...current])
    setIsCommenting(true)

    try {
      const savedComment = await addTicketComment(ticket.id, payload)
      setComments((current) =>
        current.map((comment) => (comment.id === optimisticCommentId ? savedComment : comment))
      )
    } catch (error) {
      setComments(previousComments)
      setCommentContent(contenido)
      setCommentError(getErrorMessage(error, "No se pudo guardar el comentario"))
    } finally {
      setIsCommenting(false)
    }
  }

  return (
    <div className="space-y-5">
      {ticket ? <TicketSummary ticket={ticket} /> : null}

      <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{isEditMode ? "Editar ticket" : "Crear ticket"}</CardTitle>
            <CardDescription>
              {isEditMode
                ? "Actualiza un ticket existente con optimistic UI y rollback automático."
                : "Crea un ticket nuevo con alta optimista y rollback en caso de error."}
            </CardDescription>
          </div>
          {ticket ? (
            <Link
              href={`/tickets/${ticket.id}`}
              className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Ver detalle
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {saveError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
              {saveError}
            </p>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="ticket-titulo">
              Título
            </label>
            <Input
              id="ticket-titulo"
              value={draft.titulo}
              onChange={(event) => setDraft((current) => ({ ...current, titulo: event.target.value }))}
              maxLength={160}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              htmlFor="ticket-descripcion"
            >
              Descripción
            </label>
            <Textarea
              id="ticket-descripcion"
              value={draft.descripcion}
              onChange={(event) => setDraft((current) => ({ ...current, descripcion: event.target.value }))}
              maxLength={4000}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              htmlFor="ticket-prioridad"
            >
              Prioridad
            </label>
            <Select
              id="ticket-prioridad"
              value={draft.prioridad}
              onChange={(event) => setDraft((current) => ({ ...current, prioridad: event.target.value }))}
              disabled={isSaving}
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              htmlFor="ticket-asignado"
            >
              Asignado a
            </label>
            <Input
              id="ticket-asignado"
              value={draft.asignado_a}
              onChange={(event) => setDraft((current) => ({ ...current, asignado_a: event.target.value }))}
              maxLength={120}
              disabled={isSaving}
            />
          </div>

          <div className="md:col-span-2">
            <Button onClick={onSaveTicket} disabled={isSaving}>
              {isSaving ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear ticket"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Transición de estado</CardTitle>
          <CardDescription>
            Cambia el estado usando el flujo real de transición del backend con optimistic UI y rollback.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          {transitionError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
              {transitionError}
            </p>
          ) : null}

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              htmlFor="ticket-estado"
            >
              Estado
            </label>
            <Select
              id="ticket-estado"
              value={transitionState}
              onChange={(event) => setTransitionState(event.target.value)}
              disabled={!ticket || isTransitioning}
            >
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {formatStateLabel(state)}
                </option>
              ))}
            </Select>
          </div>

          <Button
            onClick={onTransitionTicket}
            disabled={!ticket || isTransitioning || transitionState === ticket.estado}
          >
            {isTransitioning ? "Aplicando..." : "Aplicar transición"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Agregar comentario</CardTitle>
          <CardDescription>
            {ticket
              ? "El comentario aparece de inmediato; si falla el backend se revierte automáticamente."
              : "Primero crea el ticket y después agrega comentarios."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitComment} className="space-y-3">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                htmlFor="comment-content"
              >
                Comentario
              </label>
              <Textarea
                id="comment-content"
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                placeholder="Agrega una nota para el equipo"
                maxLength={4000}
                disabled={isCommenting || !canComment}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                htmlFor="comment-author"
              >
                Autor (opcional)
              </label>
              <Input
                id="comment-author"
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
                placeholder="tu.nombre@deskly.io"
                maxLength={120}
                disabled={isCommenting || !canComment}
              />
            </div>

            {commentError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {commentError}
              </p>
            ) : null}

            <Button type="submit" disabled={isCommenting || !canComment}>
              {isCommenting ? "Guardando comentario..." : "Agregar comentario"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {initialCommentsError && comments.length === 0 ? (
        <TicketDetailErrorState
          title="No se pudieron cargar los comentarios"
          message={initialCommentsError}
        />
      ) : null}
      <TicketCommentsTimeline comments={comments} />
    </div>
  )
}
