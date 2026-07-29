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
