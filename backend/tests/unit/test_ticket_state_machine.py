import pytest

from app.db import SessionLocal
from app.models import TicketWorkflowState, TicketWorkflowTransition
from app.ticket_state_machine import (
    InvalidTicketStateTransitionError,
    get_allowed_next_states,
    get_initial_ticket_state_code,
    validate_ticket_state_transition,
)


@pytest.mark.parametrize(
    ("current_state", "next_state"),
    [
        ("abierto", "en_progreso"),
        ("en_progreso", "resuelto"),
        ("resuelto", "cerrado"),
        ("resuelto", "reabierto"),
    ],
)
def test_validate_ticket_state_transition_accepts_valid_transitions(current_state, next_state):
    with SessionLocal() as db:
        validate_ticket_state_transition(current_state, next_state, db=db)


@pytest.mark.parametrize(
    ("current_state", "next_state", "expected_allowed"),
    [
        ("abierto", "cerrado", ["en_progreso"]),
        ("cerrado", "reabierto", []),
        ("reabierto", "en_progreso", []),
    ],
)
def test_validate_ticket_state_transition_rejects_invalid_transitions(
    current_state,
    next_state,
    expected_allowed,
):
    with SessionLocal() as db:
        with pytest.raises(InvalidTicketStateTransitionError) as exc_info:
            validate_ticket_state_transition(current_state, next_state, db=db)

        conflict = exc_info.value.conflict
    assert conflict.error == "invalid_state_transition"
    assert conflict.mensaje == "Transicion de estado invalida"
    assert conflict.estado_actual == current_state
    assert conflict.estado_objetivo == next_state
    assert conflict.transiciones_permitidas == expected_allowed


def test_get_allowed_next_states_reads_from_database():
    with SessionLocal() as db:
        allowed_next_states = get_allowed_next_states("resuelto", db=db)

    assert allowed_next_states == ("cerrado", "reabierto")


def test_get_initial_ticket_state_code_reads_from_database():
    with SessionLocal() as db:
        initial_state = get_initial_ticket_state_code(db=db)

    assert initial_state == "abierto"


def test_validate_ticket_state_transition_supports_dynamic_configuration():
    with SessionLocal() as db:
        backlog = TicketWorkflowState(
            codigo="backlog",
            nombre="Backlog",
            activo=True,
            es_inicial=False,
            es_terminal=False,
            orden=10,
        )
        in_progress = (
            db.query(TicketWorkflowState)
            .filter(TicketWorkflowState.codigo == "en_progreso")
            .one()
        )
        db.add(backlog)
        db.flush()
        db.add(
            TicketWorkflowTransition(
                estado_origen_id=backlog.id,
                estado_destino_id=in_progress.id,
                activa=True,
            )
        )
        db.commit()

    with SessionLocal() as db:
        validate_ticket_state_transition("backlog", "en_progreso", db=db)
