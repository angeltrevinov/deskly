# Registro de decisiones (LLMs y desarrollo)

Este archivo documenta decisiones relevantes del proyecto. El objetivo es dejar trazabilidad clara de razonamiento y criterio humano.

## Regla obligatoria
- Toda decision relevante debe registrar contexto, uso de LLM (o sin LLM), salida del modelo, decision humana y alternativa descartada.
- Antes de cerrar una decision, se debe responder explicitamente el por que.
- Si una sugerencia se acepta sin entenderla por completo, se declara.
- Alcance: aplica a todas las decisiones relevantes (arquitectura, implementacion y testing), no a cambios triviales.

## Plantilla oficial (copiar y pegar)

###[Decisión] Título breve
**Contexto:** que problema estaba resolviendo.
**Uso de LLM:** que le pedi y por que (o "sin LLM").
**Salida del modelo:** resumen de lo que propuso.
**Mi decisión:** que acepte, modifique o descarte, y con que criterio.
**Alternativa descartada:** cual era y por que no.

---

## Historial

###[Decisión] DEC-0001 - Base de datos y estrategia de migraciones
**Contexto:** habia que elegir la base de datos y la estrategia de ORM/migraciones para el backend del sistema de tickets.
**Uso de LLM:** se consulto a Copilot para comparar MongoDB vs PostgreSQL y evaluar Prisma en una arquitectura FastAPI + Next.js.
**Salida del modelo:** recomendo PostgreSQL con FastAPI y Alembic; desaconsejo Prisma como pieza central con backend Python y sugirio contrato OpenAPI para tipos en frontend.
**Mi decisión:** acepte PostgreSQL + FastAPI con Alembic, con el criterio de mantener migraciones versionadas como requisito del proyecto; ademas, los modelos ya estan definidos, no necesitamos mucha flexibilidad de esquema y los lookups/joins son una ventaja clara para una aplicacion de tickets.
**Alternativa descartada:** MongoDB (menor ajuste al modelo relacional esperado, menor ventaja en joins para este dominio) y Prisma como ORM principal (mejor encaje en ecosistema Node/TypeScript que en backend Python).

###[Decisión] DEC-0002 - Prefijo global /api y separacion de rutas por dominio
**Contexto:** el backend tenia rutas mezcladas en `main.py` y no seguia una convencion uniforme de prefijos para endpoints de API.
**Uso de LLM:** se le pidio a Copilot reorganizar endpoints para que todos los paths de API iniciaran con `/api` y aplicar separacion de responsabilidades en routers.
**Salida del modelo:** propuso crear routers por dominio (`health`, `tickets`) y un router agregador con prefijo `/api`, dejando `main.py` solo como composicion.
**Mi decisión:** acepte la reestructura para mejorar mantenibilidad, consistencia de rutas y escalabilidad del backend.
**Alternativa descartada:** mantener todo en `main.py` con rutas sueltas (descartado por baja mantenibilidad y acoplamiento alto).

###[Decisión] DEC-0003 - Estrategia de pruebas con PostgreSQL real y tests por dominio
**Contexto:** se necesitaba configurar pruebas unitarias sin usar SQLite y con separacion de concerns tambien en tests.
**Uso de LLM:** se le pidio a Copilot configurar `pytest`, mover tests por dominio y ejecutar contra PostgreSQL.
**Salida del modelo:** implemento fixtures, tests separados (`health` y `tickets`), y ejecucion de pytest dentro de Docker usando PostgreSQL.
**Mi decisión:** acepte esta estrategia porque mantiene paridad tecnologica con produccion y respeta separacion de responsabilidades en codigo de prueba.
**Alternativa descartada:** usar SQLite para tests (descartado por menor fidelidad respecto al entorno real de PostgreSQL).

###[Decisión] DEC-0004 - Entornos separados por .env.local y .env.test + nombres de proyecto Compose
**Contexto:** hacia falta separar desarrollo y testing sin compartir contenedores/volumenes y con un flujo reutilizable para pipeline.
**Uso de LLM:** se solicito a Copilot migrar la configuracion a `--env-file` y aislar recursos de Compose por entorno.
**Salida del modelo:** elimino el servicio `db_test` fijo, introdujo `.env.local` y `.env.test`, y configuro `COMPOSE_PROJECT_NAME` distinto por entorno.
**Mi decisión:** acepte este enfoque para mantener entornos separados y facilitar ejecucion de pruebas en pipeline con configuracion explicita.
**Alternativa descartada:** mantener dos bases simultaneas en un mismo compose (`db` + `db_test`) con configuracion fija (descartado por complejidad operativa y mayor riesgo de mezcla entre entornos).

###[Decisión] DEC-0005 - CI de PR enfocado primero en backend
**Contexto:** habia que configurar checks de Pull Request para asegurar calidad automatizada sin bloquear el avance del proyecto.
**Uso de LLM:** se le pidio a Copilot implementar workflow de GitHub Actions con lint, typecheck, unit tests y build Docker.
**Salida del modelo:** propuso partir los checks por stack y crear pipeline backend-only en esta fase, dejando frontend para un workflow posterior.
**Mi decisión:** acepte implementar primero solo backend porque es lo primero que vamos a construir y validar; el criterio fue priorizar cobertura inmediata sobre el codigo que ya existe y esta en desarrollo activo, y agregar frontend cuando empecemos ese trabajo.
**Alternativa descartada:** incluir desde ahora checks de frontend en el mismo workflow (descartado por prematuro mientras frontend aun no es foco de implementacion).
