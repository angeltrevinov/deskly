---
name: decision-tracking
user-invocable: false
description: "Usar al crear, actualizar o revisar decisiones del proyecto y su fundamento con LLM. Disparadores: registro de decisiones, DECISIONES.md, justificacion del por que, rationale, aceptar/modificar/descartar, alternativas descartadas, cumplimiento de reglas."
---

# Skill de seguimiento de decisiones

## Objetivo
Mantener trazabilidad clara de decisiones relevantes y del criterio humano frente a salidas de LLM.

## Reglas obligatorias
- Registrar toda decision relevante en [DECISIONES.md](../../../DECISIONES.md).
- No cerrar decisiones relevantes sin registrar el por que explicito.
- Declarar cuando una sugerencia fue aceptada sin entendimiento completo.
- Aplicar a arquitectura, implementacion y testing (no a cambios triviales).

## Formato de salida obligatorio
Para cada nueva decision usar:

###[Decisión] Título breve
**Contexto:** qué problema estaba resolviendo.
**Uso de LLM:** qué le pedí y por qué (o "sin LLM").
**Salida del modelo:** resumen de lo que propuso.
**Mi decisión:** qué acepté, modifiqué o descarté, y con qué criterio.
**Alternativa descartada:** cuál era y por qué no.

## Flujo
1. Identificar si la decision es relevante.
2. Preguntar y capturar el por que antes de cerrar.
3. Registrar contenido en el formato requerido.
4. Verificar consistencia con [RULES.md](../../../RULES.md).
