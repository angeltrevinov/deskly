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
