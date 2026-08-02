from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Ticket, TicketComentario


@dataclass(frozen=True)
class SeedComment:
    contenido: str
    autor: str
    minutos_despues: int


@dataclass(frozen=True)
class SeedTicket:
    titulo: str
    descripcion: str
    prioridad: str
    estado: str
    asignado_a: str | None
    dias_atras: int
    horas_hasta_actualizacion: int
    comentarios: list[SeedComment]


SEED_TICKETS: list[SeedTicket] = [
    SeedTicket(
        titulo="Error de login en portal cliente",
        descripcion="Usuarios reportan 401 intermitente al iniciar sesion en hora pico.",
        prioridad="alta",
        estado="abierto",
        asignado_a="soporte@deskly.io",
        dias_atras=10,
        horas_hasta_actualizacion=2,
        comentarios=[
            SeedComment(
                contenido="Confirmado en produccion y en staging con dos cuentas de prueba.",
                autor="agente1@deskly.io",
                minutos_despues=25,
            ),
            SeedComment(
                contenido="Pendiente revisar logs del auth proxy.",
                autor="backend@deskly.io",
                minutos_despues=95,
            ),
        ],
    ),
    SeedTicket(
        titulo="Consulta de facturacion duplicada",
        descripcion="Cliente recibe dos cargos en el mismo ciclo mensual.",
        prioridad="media",
        estado="en_progreso",
        asignado_a="finanzas@deskly.io",
        dias_atras=7,
        horas_hasta_actualizacion=12,
        comentarios=[
            SeedComment(
                contenido="Se encontro inconsistencia entre webhook y conciliacion manual.",
                autor="agente2@deskly.io",
                minutos_despues=40,
            )
        ],
    ),
    SeedTicket(
        titulo="Solicitud de exportar reporte CSV",
        descripcion="Equipo comercial solicita export masivo por rango de fechas.",
        prioridad="baja",
        estado="resuelto",
        asignado_a="producto@deskly.io",
        dias_atras=5,
        horas_hasta_actualizacion=30,
        comentarios=[
            SeedComment(
                contenido="Se habilito endpoint temporal con limite de 5k filas.",
                autor="backend@deskly.io",
                minutos_despues=60,
            ),
            SeedComment(
                contenido="Validado por comercial en sandbox.",
                autor="qa@deskly.io",
                minutos_despues=260,
            ),
        ],
    ),
    SeedTicket(
        titulo="Incidente de timeout en API externa",
        descripcion="Integracion de pagos supera timeout y bloquea checkout.",
        prioridad="alta",
        estado="cerrado",
        asignado_a="integraciones@deskly.io",
        dias_atras=3,
        horas_hasta_actualizacion=8,
        comentarios=[
            SeedComment(
                contenido="Mitigacion aplicada con reintentos exponenciales.",
                autor="backend@deskly.io",
                minutos_despues=50,
            ),
            SeedComment(
                contenido="Monitoreo estable por 24h, se procede a cierre.",
                autor="oncall@deskly.io",
                minutos_despues=380,
            ),
        ],
    ),
    SeedTicket(
        titulo="Reapertura: validacion de cupones",
        descripcion="Regresion reportada tras deploy del viernes en cupones promocionales.",
        prioridad="media",
        estado="reabierto",
        asignado_a=None,
        dias_atras=1,
        horas_hasta_actualizacion=6,
        comentarios=[
            SeedComment(
                contenido="Reabierto por soporte luego de nuevo reporte.",
                autor="soporte@deskly.io",
                minutos_despues=20,
            )
        ],
    ),
]


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("count must be >= 1")
    return parsed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed demo tickets and comments into database.")
    parser.add_argument(
        "--force-reset",
        action="store_true",
        help="Delete existing tickets/comments before inserting demo data.",
    )
    parser.add_argument(
        "--count",
        type=positive_int,
        default=len(SEED_TICKETS),
        help="How many tickets to generate (default: base demo set size).",
    )
    return parser.parse_args()


def seed_database(db: Session, force_reset: bool, count: int) -> int:
    existing_count = db.scalar(select(func.count(Ticket.id))) or 0

    if existing_count > 0 and not force_reset:
        print(
            "Seed skipped: existing tickets found. "
            "Use --force-reset to replace current tickets with demo data."
        )
        return 0

    if force_reset:
        db.execute(delete(TicketComentario))
        db.execute(delete(Ticket))
        db.commit()

    now = datetime.now(timezone.utc).replace(microsecond=0)

    inserted = 0
    for index in range(count):
        template = SEED_TICKETS[index % len(SEED_TICKETS)]

        created_shift_days = template.dias_atras + (index // len(SEED_TICKETS))
        created_shift_hours = index % 24
        created_shift_minutes = (index * 7) % 60

        creado_en = now - timedelta(
            days=created_shift_days,
            hours=created_shift_hours,
            minutes=created_shift_minutes,
        )
        actualizado_en = creado_en + timedelta(hours=template.horas_hasta_actualizacion + (index % 6))

        titulo = template.titulo if index < len(SEED_TICKETS) else f"{template.titulo} #{index + 1}"
        descripcion = (
            template.descripcion
            if index < len(SEED_TICKETS)
            else f"{template.descripcion} Ticket de seed para pruebas de paginacion."
        )

        ticket = Ticket(
            titulo=titulo,
            descripcion=descripcion,
            prioridad=template.prioridad,
            estado=template.estado,
            asignado_a=template.asignado_a,
            creado_en=creado_en,
            actualizado_en=actualizado_en,
        )
        db.add(ticket)
        db.flush()

        for comment in template.comentarios:
            db.add(
                TicketComentario(
                    ticket_id=ticket.id,
                    contenido=comment.contenido,
                    autor=comment.autor,
                    creado_en=creado_en + timedelta(minutes=comment.minutos_despues + (index % 10)),
                )
            )

        inserted += 1

    db.commit()
    print(f"Seed completed: inserted {inserted} tickets with demo comments.")
    return inserted


def main() -> None:
    args = parse_args()
    db = SessionLocal()
    try:
        seed_database(db, force_reset=args.force_reset, count=args.count)
    finally:
        db.close()


if __name__ == "__main__":
    main()
