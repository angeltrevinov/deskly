from dataclasses import dataclass

from app.models import TicketEstado
from app.schemas import TicketStateTransitionConflict


@dataclass(frozen=True)
class TransitionRule:
    from_state: TicketEstado
    to_state: TicketEstado


DEFAULT_TRANSITION_RULES: tuple[TransitionRule, ...] = (
    TransitionRule(from_state=TicketEstado.ABIERTO, to_state=TicketEstado.EN_PROGRESO),
    TransitionRule(from_state=TicketEstado.EN_PROGRESO, to_state=TicketEstado.RESUELTO),
    TransitionRule(from_state=TicketEstado.RESUELTO, to_state=TicketEstado.CERRADO),
    TransitionRule(from_state=TicketEstado.RESUELTO, to_state=TicketEstado.REABIERTO),
)


def build_transition_map(
    transition_rules: tuple[TransitionRule, ...],
) -> dict[TicketEstado, tuple[TicketEstado, ...]]:
    transitions: dict[TicketEstado, list[TicketEstado]] = {state: [] for state in TicketEstado}

    for rule in transition_rules:
        transitions[rule.from_state].append(rule.to_state)

    return {state: tuple(next_states) for state, next_states in transitions.items()}


def get_allowed_next_states(
    current_state: TicketEstado,
    transition_rules: tuple[TransitionRule, ...] = DEFAULT_TRANSITION_RULES,
) -> tuple[TicketEstado, ...]:
    transition_map = build_transition_map(transition_rules)
    return transition_map[current_state]


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


def validate_ticket_state_transition(
    current_state: TicketEstado,
    next_state: TicketEstado,
    transition_rules: tuple[TransitionRule, ...] = DEFAULT_TRANSITION_RULES,
) -> None:
    allowed_next_states = get_allowed_next_states(current_state, transition_rules=transition_rules)
    if next_state in allowed_next_states:
        return

    raise InvalidTicketStateTransitionError(current_state, next_state, allowed_next_states)
