import pytest

from app.models import TicketEstado
from app.ticket_state_machine import (
    InvalidTicketStateTransitionError,
    validate_ticket_state_transition,
)


@pytest.mark.parametrize(
    ("current_state", "next_state"),
    [
        (TicketEstado.ABIERTO, TicketEstado.EN_PROGRESO),
        (TicketEstado.EN_PROGRESO, TicketEstado.RESUELTO),
        (TicketEstado.RESUELTO, TicketEstado.CERRADO),
        (TicketEstado.RESUELTO, TicketEstado.REABIERTO),
    ],
)
def test_validate_ticket_state_transition_accepts_valid_transitions(current_state, next_state):
    validate_ticket_state_transition(current_state, next_state)


@pytest.mark.parametrize(
    ("current_state", "next_state", "expected_allowed"),
    [
        (TicketEstado.ABIERTO, TicketEstado.CERRADO, [TicketEstado.EN_PROGRESO]),
        (TicketEstado.CERRADO, TicketEstado.REABIERTO, []),
        (TicketEstado.REABIERTO, TicketEstado.EN_PROGRESO, []),
    ],
)
def test_validate_ticket_state_transition_rejects_invalid_transitions(
    current_state,
    next_state,
    expected_allowed,
):
    with pytest.raises(InvalidTicketStateTransitionError) as exc_info:
        validate_ticket_state_transition(current_state, next_state)

    conflict = exc_info.value.conflict
    assert conflict.error == "invalid_state_transition"
    assert conflict.mensaje == "Transicion de estado invalida"
    assert conflict.estado_actual == current_state
    assert conflict.estado_objetivo == next_state
    assert conflict.transiciones_permitidas == expected_allowed
