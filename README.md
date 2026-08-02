# Deskly

Base minima para una app de ticketing estilo Deskly con backend en FastAPI, frontend en Next.js y Docker Compose.

## Requisitos

- Docker y Docker Compose

## Ejecucion

```bash
docker compose --env-file .env.local up --build
```

Para desarrollo se usa `.env.local`.
Para pruebas se usa `.env.test`.

Cada entorno define un `COMPOSE_PROJECT_NAME` distinto para aislar contenedores, red y volumenes.

## URLs de desarrollo

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/api/health
- PostgreSQL: localhost:5432

## Que esperar

Esta base ejecuta tres contenedores:

- `db`: PostgreSQL en el puerto 5432
- `backend`: FastAPI en el puerto 8000
- `frontend`: Next.js en el puerto 3000

El backend espera el healthcheck de PostgreSQL antes de iniciar.
El frontend espera el healthcheck del backend antes de iniciar.

## API

Todas las rutas de la API empiezan con `/api`.

- `GET /api/health`: ruta exclusiva para comprobar que el backend esta funcionando y puede conectarse a la base de datos.
- `GET /api/tickets`
- `GET /api/tickets/{ticket_id}`
- `POST /api/tickets`
- `POST /api/webhooks/tickets`

### Webhook de ingesta

Ruta:

- `POST /api/webhooks/tickets`

Headers requeridos:

- `X-Deskly-Timestamp`: timestamp Unix en segundos.
- `X-Deskly-Signature`: firma HMAC-SHA256 del mensaje `timestamp.raw_body`.

Reglas:

- Firma invalida: `401`.
- Timestamp fuera de ventana (`WEBHOOK_REPLAY_WINDOW_SECONDS`): `401`.
- Payload invalido: `422`.
- `event_id` duplicado: `200` sin crear ticket nuevo.

### WebSocket tickets

- `WS /api/tickets/ws/tickets`
  - Sin query params: recibe eventos de todos los tickets.
  - Con `?ticket_id=<id>`: recibe solo eventos del ticket indicado.

Eventos emitidos:

- `ticket.creado`
- `ticket.actualizado`
- `ticket.comentado`

Cada mensaje tiene el formato:

```json
{
  "event": "ticket.creado",
  "ticket_id": 123,
  "payload": { "...": "..." }
}
```

## Workflow de estados configurable en DB

Las transiciones de estado de ticket ya no están hardcodeadas en el backend. Se leen desde tablas de configuración:

- `ticket_workflow_states`
- `ticket_workflow_transitions`

Para agregar un estado o transición nueva no hace falta redeploy del backend; basta actualizar esas tablas.

Ejemplo SQL para agregar una nueva transición `resuelto -> qa_verificado`:

```sql
INSERT INTO ticket_workflow_states (codigo, nombre, activo, es_inicial, es_terminal, orden)
VALUES ('qa_verificado', 'QA verificado', true, false, false, 6)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ticket_workflow_transitions (estado_origen_id, estado_destino_id, activa)
SELECT s_from.id, s_to.id, true
FROM ticket_workflow_states s_from
JOIN ticket_workflow_states s_to
  ON s_from.codigo = 'resuelto' AND s_to.codigo = 'qa_verificado'
ON CONFLICT (estado_origen_id, estado_destino_id) DO NOTHING;
```

## Migraciones (Alembic)

Aplicar migraciones:

```bash
docker compose run --rm backend alembic upgrade head
```

Crear una nueva migracion:

```bash
docker compose run --rm backend alembic revision -m "descripcion_del_cambio"
```

Crear migracion automatica desde modelos:

```bash
docker compose run --rm backend alembic revision --autogenerate -m "descripcion_del_cambio"
```

## Seed de datos demo (tickets y comentarios)

Poblar la base con tickets/comentarios en distintos estados y fechas:

```bash
docker compose run --rm backend python -m app.seed_data
```

Generar más volumen para probar paginación (ejemplo 120 tickets):

```bash
docker compose run --rm backend python -m app.seed_data --force-reset --count 120
```

Comportamiento:

- Si ya hay tickets, no sobreescribe nada (sale sin cambios).
- Para reemplazar datos actuales por el seed demo:

```bash
docker compose run --rm backend python -m app.seed_data --force-reset
```

## Pruebas

Las pruebas del backend usan PostgreSQL con variables de entorno de `.env.test`.

Levantar dependencias para tests:

```bash
docker compose --env-file .env.test up -d db
```

Ejecutar pruebas del backend:

```bash
docker compose --env-file .env.test run --rm backend pytest
```

Limpieza del entorno de pruebas:

```bash
docker compose --env-file .env.test down --remove-orphans
```

## Detener

```bash
docker compose down
```

## Que incluye

- App FastAPI con endpoint de health minimo
- App Next.js App Router con home minima
- Dockerfiles multi-stage para ambos servicios
- Entrypoint de Docker Compose con healthchecks

## Limitacion en multiples replicas (WebSocket)

La implementacion actual de WebSocket mantiene conexiones en memoria dentro de cada proceso del backend. Esto significa que, con multiples replicas, un evento emitido en una replica no se propaga automaticamente a clientes conectados en otras replicas.

### Como resolverlo en produccion

Usar un broker de pub/sub compartido (por ejemplo Redis Pub/Sub, NATS o Kafka):

1. Cada replica publica eventos de ticket en el broker.
2. Cada replica se suscribe a esos eventos y reenvia a sus clientes WebSocket locales.
3. Se mantiene una distribucion consistente de eventos entre todas las replicas.
