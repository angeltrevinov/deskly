# Deskly

Base minima para una app de ticketing estilo Deskly con backend en FastAPI, frontend en Next.js y Docker Compose.

## Requisitos

- Docker y Docker Compose

## Ejecucion

```bash
cp .env.example .env
docker compose up --build
```

Si ya tienes un archivo `.env`, puedes omitir el paso de copia.

## URLs de desarrollo

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## Que esperar

Esta base ejecuta dos contenedores:

- `backend`: FastAPI en el puerto 8000
- `frontend`: Next.js en el puerto 3000

El frontend espera el healthcheck del backend antes de iniciar.

## Detener

```bash
docker compose down
```

## Que incluye

- App FastAPI con endpoint de health minimo
- App Next.js App Router con home minima
- Dockerfiles multi-stage para ambos servicios
- Entrypoint de Docker Compose con healthchecks
