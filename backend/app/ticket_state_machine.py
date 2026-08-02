from dataclasses import dataclass

from sqlalchemy.orm import Session, aliased

from app.models import TicketWorkflowState, TicketWorkflowTransition
from app.schemas import TicketStateTransitionConflict


@dataclass(frozen=True)
class DefaultStateSeed:
    codigo: str
    nombre: str
    es_inicial: bool = False
    es_terminal: bool = False
    orden: int = 0


DEFAULT_WORKFLOW_STATES: tuple[DefaultStateSeed, ...] = (
    DefaultStateSeed(codigo="abierto", nombre="Abierto", es_inicial=True, orden=1),
    DefaultStateSeed(codigo="en_progreso", nombre="En progreso", orden=2),
    DefaultStateSeed(codigo="resuelto", nombre="Resuelto", orden=3),
    DefaultStateSeed(codigo="cerrado", nombre="Cerrado", es_terminal=True, orden=4),
    DefaultStateSeed(codigo="reabierto", nombre="Reabierto", orden=5),
)

DEFAULT_WORKFLOW_TRANSITIONS: tuple[tuple[str, str], ...] = (
    ("abierto", "en_progreso"),
    ("en_progreso", "resuelto"),
    ("resuelto", "cerrado"),
    ("resuelto", "reabierto"),
)


def seed_default_ticket_workflow(db: Session) -> None:
    existing_states = db.query(TicketWorkflowState.id).limit(1).first()
    if existing_states is not None:
        return

    state_entities: dict[str, TicketWorkflowState] = {}
    for state in DEFAULT_WORKFLOW_STATES:
        entity = TicketWorkflowState(
            codigo=state.codigo,
            nombre=state.nombre,
            activo=True,
            es_inicial=state.es_inicial,
            es_terminal=state.es_terminal,
            orden=state.orden,
        )
        db.add(entity)
        state_entities[state.codigo] = entity

    db.flush()

    for from_code, to_code in DEFAULT_WORKFLOW_TRANSITIONS:
        db.add(
            TicketWorkflowTransition(
                estado_origen_id=state_entities[from_code].id,
                estado_destino_id=state_entities[to_code].id,
                activa=True,
            )
        )

    db.flush()


def get_initial_ticket_state_code(db: Session) -> str:
    initial_state = (
        db.query(TicketWorkflowState)
        .filter(TicketWorkflowState.activo.is_(True), TicketWorkflowState.es_inicial.is_(True))
        .order_by(TicketWorkflowState.orden.asc(), TicketWorkflowState.id.asc())
        .first()
    )

    if initial_state is None:
        raise RuntimeError("No existe un estado inicial activo configurado para tickets")

    return initial_state.codigo


def get_allowed_next_states(current_state: str, db: Session) -> tuple[str, ...]:
    origin_state = aliased(TicketWorkflowState)
    destination_state = aliased(TicketWorkflowState)

    rows = (
        db.query(destination_state.codigo)
        .join(
            TicketWorkflowTransition,
            TicketWorkflowTransition.estado_destino_id == destination_state.id,
        )
        .join(
            origin_state,
            origin_state.id == TicketWorkflowTransition.estado_origen_id,
        )
        .filter(
            TicketWorkflowTransition.activa.is_(True),
            origin_state.codigo == current_state,
            origin_state.activo.is_(True),
            destination_state.activo.is_(True),
        )
        .order_by(destination_state.orden.asc(), destination_state.codigo.asc())
        .all()
    )

    return tuple(row[0] for row in rows)


class InvalidTicketStateTransitionError(Exception):
    def __init__(
        self,
        current_state: str,
        next_state: str,
        allowed_next_states: tuple[str, ...],
    ) -> None:
        self.conflict = TicketStateTransitionConflict(
            error="invalid_state_transition",
            mensaje="Transicion de estado invalida",
            estado_actual=current_state,
            estado_objetivo=next_state,
            transiciones_permitidas=list(allowed_next_states),
        )
        super().__init__(self.conflict.mensaje)


def validate_ticket_state_transition(
    current_state: str,
    next_state: str,
    db: Session,
) -> None:
    allowed_next_states = get_allowed_next_states(current_state, db=db)
    if next_state in allowed_next_states:
        return

    raise InvalidTicketStateTransitionError(current_state, next_state, allowed_next_states)
