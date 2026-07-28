# Deskly

Bare-bones starter for a Deskly-style ticketing app with a FastAPI backend, a Next.js frontend, and Docker Compose.

## Requirements

- Docker and Docker Compose

## Run

```bash
cp .env.example .env
docker compose up --build
```

If you already have a `.env` file, you can skip the copy step.

## Development URLs

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## What to expect

This starter runs two containers:

- `backend`: FastAPI on port 8000
- `frontend`: Next.js on port 3000

The frontend waits for the backend healthcheck before starting.

## Stop

```bash
docker compose down
```

## What is included

- FastAPI app with a minimal health endpoint
- Next.js App Router app with a minimal home page
- Multi-stage Dockerfiles for both services
- Docker Compose entrypoint with healthchecks
