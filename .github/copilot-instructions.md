# Reglas LLM de Deskly

Estas instrucciones aplican a todo el workspace.

## Politica de decisiones (obligatoria)
- Toda decision relevante debe registrarse en [DECISIONES.md](../DECISIONES.md).
- Antes de cerrar una decision relevante, pedir y registrar explicitamente el por que.
- Si una sugerencia del LLM se acepta sin entenderla completamente, declararlo.
- Cobertura: arquitectura, implementacion y testing. Excluir cambios triviales.

## Formato obligatorio de decision
Usar exactamente este formato para nuevas entradas en [DECISIONES.md](../DECISIONES.md):

###[Decisión] Título breve
**Contexto:** qué problema estaba resolviendo.
**Uso de LLM:** qué le pedí y por qué (o "sin LLM").
**Salida del modelo:** resumen de lo que propuso.
**Mi decisión:** qué acepté, modifiqué o descarté, y con qué criterio.
**Alternativa descartada:** cuál era y por qué no.

## Fuente de reglas
- Reglas versionadas: [RULES.md](../RULES.md)
- Registro historico de decisiones: [DECISIONES.md](../DECISIONES.md)
