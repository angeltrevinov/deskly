"use client"

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
  type Ticket,
  type TicketCommentCreate,
  type TicketCommentRead,
  type TicketUpdate,
  updateTicket,
} from "@/lib/api"

type TicketDetailWorkbenchProps = {
  ticketId: string
  initialTicket: Ticket
  initialComments: TicketCommentRead[]
  initialCommentsError?: string | null
}

type TicketDraft = {
  titulo: string
  descripcion: string
  prioridad: string
  asignado_a: string
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

export function TicketDetailWorkbench({
  ticketId,
  initialTicket,
  initialComments,
  initialCommentsError = null,
}: TicketDetailWorkbenchProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [comments, setComments] = useState(initialComments)
  const [draft, setDraft] = useState<TicketDraft>(() => createDraftFromTicket(initialTicket))
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(initialCommentsError)
  const [commentContent, setCommentContent] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("")

  const priorityOptions = useMemo(() => {
    const baseOptions = ["alta", "media", "baja"]
    if (!baseOptions.includes(ticket.prioridad)) {
      return [ticket.prioridad, ...baseOptions]
    }
    return baseOptions
  }, [ticket.prioridad])

  const hasChanges =
    draft.titulo.trim() !== ticket.titulo ||
    draft.descripcion.trim() !== (ticket.descripcion ?? "") ||
    draft.prioridad !== ticket.prioridad ||
    draft.asignado_a.trim() !== (ticket.asignado_a ?? "")

  const onCancelEdit = () => {
    setDraft(createDraftFromTicket(ticket))
    setIsEditing(false)
    setUpdateError(null)
  }

  const onSaveEdit = async () => {
    if (!hasChanges || isSaving) {
      setIsEditing(false)
      return
    }

    const previousTicket = ticket
    const payload: TicketUpdate = {
      titulo: draft.titulo.trim(),
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

    setUpdateError(null)
    setTicket(optimisticTicket)
    setIsSaving(true)

    try {
      const updated = await updateTicket(ticketId, payload)
      setTicket(updated)
      setDraft(createDraftFromTicket(updated))
      setIsEditing(false)
    } catch (error) {
      setTicket(previousTicket)
      setUpdateError(getErrorMessage(error, "No se pudo actualizar el ticket"))
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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
      const savedComment = await addTicketComment(ticketId, payload)
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
      <TicketSummary ticket={ticket} />

      <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Edición rápida</CardTitle>
            <CardDescription>
              Ajusta campos clave del ticket con actualización optimista y rollback automático en caso de error.
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Editar ticket
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {updateError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {updateError}
            </p>
          ) : null}

          {isEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
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

              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button onClick={onSaveEdit} disabled={!hasChanges || isSaving}>
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button variant="ghost" onClick={onCancelEdit} disabled={isSaving}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Usa el botón <span className="font-medium text-foreground">Editar ticket</span> para actualizar título,
              descripción, prioridad y asignación.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/85 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Agregar comentario</CardTitle>
          <CardDescription>
            El comentario aparece de inmediato en la UI; si el backend falla se revierte automáticamente.
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
                disabled={isCommenting}
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
                disabled={isCommenting}
              />
            </div>

            {commentError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {commentError}
              </p>
            ) : null}

            <Button type="submit" disabled={isCommenting}>
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
