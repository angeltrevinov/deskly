# Reglas y Requerimientos del Proyecto

## Proposito
Fuente unica de verdad para trackear reglas activas del proyecto, por que existen y cuando cambiaron.

## Alcance
Estas reglas aplican al trabajo del proyecto, especialmente a decisiones apoyadas por LLMs.

## Reglas activas

### [R-001] Documentar toda decision relevante asistida por LLM
- Requirement: Toda decision relevante debe documentarse en [DECISIONES.md](DECISIONES.md) usando el formato requerido.
- Why: La evaluacion se enfoca en el razonamiento humano, no solo en codigo generado.
- Status: active
- Since: 2026-07-28

### [R-002] Capturar siempre el por que antes de cerrar una decision relevante
- Requirement: Antes de cerrar una decision relevante, declarar explicitamente por que se tomo.
- Why: Mantiene criterios de decision defendibles y auditables.
- Status: active
- Since: 2026-07-28

### [R-003] Cobertura de decisiones
- Requirement: Aplicar este proceso a todas las decisiones relevantes de arquitectura, implementacion y testing.
- Why: Trazabilidad balanceada sin sobrecargar cambios triviales.
- Status: active
- Since: 2026-07-28

### [R-004] Honestidad sobre justificacion inventada
- Requirement: Si una sugerencia se acepto sin entendimiento completo, declararlo.
- Why: Vacios honestos son mejores que confianza fabricada.
- Status: active
- Since: 2026-07-28

### [R-005] Estandar de defendibilidad
- Requirement: Cualquier linea de codigo importante debe poder explicarse por quien la escribio en revision/entrevista.
- Why: No poder explicar decisiones es un riesgo mayor que funcionalidad incompleta.
- Status: active
- Since: 2026-07-28

## Historial de cambios de reglas

### 2026-07-29
- Se agrego el archivo inicial de registro de reglas y reglas base R-001 a R-005.
- Se agregaron archivos de convencion consumibles por LLM: `.github/copilot-instructions.md` y `.github/skills/decision-tracking/SKILL.md`.
- Se migro el idioma y nombre del registro de decisiones de `DECISIONES.md` a `DECISIONS.md`.
- Se revierte el idioma a espanol y el nombre vuelve a `DECISIONES.md`.

## Como agregar una nueva regla
Copiar este bloque:

### [R-XXX] Titulo breve de la regla
- Requirement:
- Why:
- Status: active | deprecated | replaced
- Since: YYYY-MM-DD
- Replaces: R-XXX (optional)
- Notes:

## Archivos relacionados
- [DECISIONES.md](DECISIONES.md)
- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [.github/skills/decision-tracking/SKILL.md](.github/skills/decision-tracking/SKILL.md)
