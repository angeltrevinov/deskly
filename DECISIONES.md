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

###[Decisión] DEC-0006 - Actualización parcial de tickets con PATCH
**Contexto:** hacía falta exponer `PATCH /api/tickets/{id}` para actualizar campos de un ticket sin reemplazar el recurso completo.
**Uso de LLM:** se le pidió a Copilot implementar la ruta, validaciones y pruebas de actualización parcial en el backend FastAPI.
**Salida del modelo:** propuso un esquema `TicketUpdate` con campos opcionales y validación para rechazar payload vacío, más el handler que aplica solo campos enviados y responde 404 cuando no existe el ticket.
**Mi decisión:** acepté la propuesta porque reduce riesgo de sobrescritura accidental, mantiene semántica correcta de PATCH y deja cobertura de pruebas para caso exitoso, ticket inexistente y payload vacío.
**Alternativa descartada:** usar `PUT` con payload completo (descartado porque exige enviar todos los campos y aumenta riesgo de pérdida de datos al actualizar parcialmente).

###[Decisión] DEC-0007 - Endpoint dedicado para comentarios de tickets
**Contexto:** hacia falta exponer `POST /api/tickets/{id}/comentarios` para registrar comentarios vinculados a un ticket existente.
**Uso de LLM:** se le pidio a Copilot implementar modelo, migracion, esquema de entrada/salida, ruta y pruebas de integracion para comentarios.
**Salida del modelo:** propuso una tabla `ticket_comentarios` con `ticket_id` FK y borrado en cascada, un endpoint que valida existencia del ticket y devuelve el comentario creado con `201`.
**Mi decisión:** acepte este enfoque porque separa responsabilidades entre ticket y comentario, mantiene integridad referencial en DB y deja trazabilidad con pruebas para caso exitoso y ticket inexistente.
**Alternativa descartada:** guardar comentarios embebidos en un campo de texto del ticket (descartado por baja trazabilidad y dificultad para consultar/ordenar comentarios individualmente).

###[Decisión] DEC-0008 - Listado de tickets con filtros, offset y ordenamiento
**Contexto:** se necesitaba que `GET /api/tickets` aceptara paginación por offset, filtros de estado/prioridad/asignado/fechas y ordenamiento por parámetros para soportar consultas más precisas.
**Uso de LLM:** se le pidió a Copilot implementar filtros y sort en la ruta de listado junto con pruebas de integración.
**Salida del modelo:** propuso agregar query params (`offset`, `limit`, `estado`, `prioridad`, `asignado`, rangos de fechas y `sort_by`/`sort_order`) con mapeo controlado de columnas para ordenar y tests para validar comportamiento.
**Mi decisión:** acepté esta implementación porque mantiene un contrato simple vía query params, evita SQL dinámico inseguro y cubre los casos base de paginación y filtrado requeridos.
**Alternativa descartada:** crear rutas separadas por cada combinación de filtro u ordenar libremente por texto recibido (descartado por complejidad de API y riesgo de errores/abuso).

###[Decisión] DEC-0009 - Listado de comentarios por ticket con offset
**Contexto:** se necesitaba exponer `GET /api/tickets/{id}/comentarios` para consultar comentarios de un ticket en orden del más reciente al más antiguo y con paginación por offset.
**Uso de LLM:** se le pidió a Copilot implementar la ruta de lectura de comentarios con paginación y pruebas de integración.
**Salida del modelo:** propuso reutilizar validación de ticket existente, ordenar por `creado_en desc` con desempate por `id desc`, y aceptar `offset`/`limit` como query params.
**Mi decisión:** acepté esta implementación porque cumple el comportamiento solicitado (más recientes primero), mantiene resultados estables entre páginas y deja cobertura para paginación y ticket no encontrado.
**Alternativa descartada:** ordenar ascendente o paginar por cursor en esta etapa (descartado porque no coincide con el requerimiento actual y agregaría complejidad prematura).

###[Decisión] DEC-0010 - Máquina de estados de tickets y lógica reutilizable
**Contexto:** se necesitaba imponer transiciones válidas explícitas de estado para tickets y evitar errores internos cuando una transición fuera inválida.
**Uso de LLM:** se le pidió a Copilot diseñar e implementar la máquina de estados con respuesta `409` tipada y reorganizar la lógica para que no quedara acoplada a un solo endpoint.
**Salida del modelo:** propuso un módulo compartido con la definición de transiciones permitidas y una validación reutilizable, además de un endpoint de transición y protección equivalente en `PATCH` para impedir bypass de reglas.
**Mi decisión:** acepté mover la lógica de negocio a un archivo universal porque el objetivo es tener un flujo claro del ciclo de vida del ticket, con reglas consistentes reutilizables por rutas actuales y futuras.
**Alternativa descartada:** mantener la lógica de transición directamente en cada route (descartado por duplicación, mayor riesgo de inconsistencias y menor mantenibilidad).

###[Decisión] DEC-0011 - Ruta singular para transición de estado
**Contexto:** la documentación del proyecto define el endpoint de transición en singular y esta ruta aún era nueva, por lo que no existían clientes externos que dependieran de la variante plural.
**Uso de LLM:** se le pidió a Copilot ajustar contrato y pruebas para usar exclusivamente `/api/tickets/{id}/transicion`.
**Salida del modelo:** propuso renombrar la ruta en el router y actualizar todas las pruebas de integración asociadas al flujo de transición.
**Mi decisión:** acepté usar únicamente la forma singular `transicion` para mantener consistencia con la documentación oficial y evitar ambigüedad en el contrato de API.
**Alternativa descartada:** mantener ambas rutas (`transicion` y `transiciones`) con alias temporal (descartado porque no hay clientes por compatibilizar y añadiría complejidad innecesaria).

###[Decisión] DEC-0012 - Motor de transiciones declarativo y configurable
**Contexto:** la validación con diccionario fijo estado->siguientes era funcional, pero complicaba escalar a nuevos flujos (por ejemplo `abierto -> cerrado` o `abierto -> invalido`) sin tocar lógica central repetidamente.
**Uso de LLM:** se le pidió a Copilot proponer una base más flexible para la máquina de estados considerando que la funcionalidad es nueva y no hay compatibilidad histórica que preservar.
**Salida del modelo:** propuso reemplazar el mapeo fijo por reglas declarativas de transición (`TransitionRule`) y construir el mapa de ejecución desde esas reglas, permitiendo inyectar reglas personalizadas por flujo.
**Mi decisión:** acepté la refactorización porque prioriza extensibilidad: agregar o cambiar flujos se vuelve un cambio de configuración de reglas, no una reescritura del motor de validación.
**Alternativa descartada:** mantener el diccionario fijo como única fuente de verdad (descartado por menor flexibilidad y mayor costo de mantenimiento al crecer reglas de negocio).
