from app.models import TicketEstado
from app.schemas import TicketStateTransitionConflict

ALLOWED_STATE_TRANSITIONS: dict[TicketEstado, tuple[TicketEstado, ...]] = {
    TicketEstado.ABIERTO: (TicketEstado.EN_PROGRESO,),
    TicketEstado.EN_PROGRESO: (TicketEstado.RESUELTO,),
    TicketEstado.RESUELTO: (TicketEstado.CERRADO, TicketEstado.REABIERTO),
    TicketEstado.CERRADO: (),
    TicketEstado.REABIERTO: (),
}


class InvalidTicketStateTransitionError(Exception):
    def __init__(
        self,
        current_state: TicketEstado,
        next_state: TicketEstado,
        allowed_next_states: tuple[TicketEstado, ...],
    ) -> None:
        self.conflict = TicketStateTransitionConflict(
            error="invalid_state_transition",
            mensaje="Transicion de estado invalida",
            estado_actual=current_state,
            estado_objetivo=next_state,
            transiciones_permitidas=list(allowed_next_states),
        )
        super().__init__(self.conflict.mensaje)


def validate_ticket_state_transition(current_state: TicketEstado, next_state: TicketEstado) -> None:
    allowed_next_states = ALLOWED_STATE_TRANSITIONS[current_state]
    if next_state in allowed_next_states:
        return

    raise InvalidTicketStateTransitionError(current_state, next_state, allowed_next_states)
