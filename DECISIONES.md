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

###[Decisión] DEC-0013 - WebSocket de tickets con suscripción global o por ticket
**Contexto:** se requería un canal en tiempo real para que usuarios pudieran detectar tickets nuevos de forma global y también rastrear un ticket específico sin ruido de otros eventos.
**Uso de LLM:** se le pidió a Copilot implementar `WS /api/tickets/ws/tickets` con filtro opcional por `ticket_id`, emisión de eventos (`ticket.creado`, `ticket.actualizado`, `ticket.comentado`) y manejo de ciclo de vida de conexiones.
**Salida del modelo:** propuso un manager en memoria para registrar conexiones globales y por ticket, emitir eventos según ámbito, limpiar desconexiones y documentar limitación en múltiples réplicas con estrategia pub/sub para producción.
**Mi decisión:** acepté este enfoque porque cubre de inmediato los dos casos de uso (visión global y tracking puntual), mantiene el diseño simple para la fase actual y deja claro el camino de escalamiento.
**Alternativa descartada:** implementar desde ahora infraestructura distribuida (Redis/NATS/Kafka) para fan-out cross-réplica (descartado por complejidad prematura para el alcance actual).

###[Decisión] DEC-0014 - Webhook firmado con HMAC, replay window e idempotencia persistente
**Contexto:** hacía falta implementar `POST /api/webhooks/tickets` para crear tickets desde un sistema externo, con seguridad de firma, defensa contra replay y garantía de idempotencia por `event_id`.
**Uso de LLM:** se le pidió a Copilot diseñar e implementar la ruta de webhook, el almacenamiento de idempotencia y pruebas para casos válidos e inválidos.
**Salida del modelo:** propuso validar firma HMAC-SHA256 en tiempo constante sobre `timestamp.raw_body`, aplicar ventana temporal configurable para replay, y persistir eventos procesados en tabla dedicada con `event_id` único para devolver `200` en duplicados sin efectos secundarios.
**Mi decisión:** acepté este enfoque porque cumple explícitamente los requisitos de seguridad y consistencia, y prioriza una implementación explicable y comprobable con tests de integración. El por qué explícito es reducir riesgo de tickets duplicados o falsificados manteniendo una ruta operable con infraestructura actual.
**Alternativa descartada:** implementar idempotencia en memoria o cache local por proceso (descartado porque se pierde al reiniciar, no escala entre réplicas y no garantiza consistencia transaccional con la creación del ticket).

###[Decisión] DEC-0015 - Workflow de estados y transiciones persistido en base de datos
**Contexto:** hacía falta evitar redeploys del backend cada vez que cambiara un estado o una transición de tickets.
**Uso de LLM:** se le pidió a Copilot proponer e implementar un diseño para desacoplar el workflow de tickets del código y moverlo a una configuración editable.
**Salida del modelo:** propuso crear tablas `ticket_workflow_states` y `ticket_workflow_transitions`, sembrar reglas iniciales por migración y validar transiciones en runtime consultando DB.
**Mi decisión:** acepté este diseño porque hoy no hay clientes productivos ni restricciones de compatibilidad, y el por qué explícito es ganar flexibilidad operativa para agregar estados/transiciones sin tocar ni desplegar el backend.
**Alternativa descartada:** mantener enum y reglas hardcodeadas con feature flags por entorno (descartado porque seguiría requiriendo cambios de código y despliegues ante cada ajuste de workflow).

###[Decisión] DEC-0016 - Integración de shadcn/ui como base del frontend
**Contexto:** hacía falta establecer una base de componentes reusable para el frontend en Next.js antes de avanzar con dashboard, detalle SSR y estados interactivos más complejos.
**Uso de LLM:** se le pidió a Copilot integrar shadcn/ui en el proyecto actual y dejar la configuración mínima funcional sobre Next.js App Router.
**Salida del modelo:** propuso agregar Tailwind CSS, utilidades de shadcn (`class-variance-authority`, `clsx`, `tailwind-merge`), configuración `components.json`, helpers compartidos y componentes base como `Button` y `Card`.
**Mi decisión:** acepté esta integración porque el por qué explícito fue combinar estandarización de componentes, velocidad de desarrollo, accesibilidad base y alta customización con una solución popular, ligera y fácil de integrar con Next.js.
**Alternativa descartada:** construir una librería visual casera desde cero o adoptar un kit más cerrado (descartado por mayor costo inicial o menor flexibilidad para adaptar el diseño del proyecto).

###[Decisión] DEC-0017 - Instrucción persistente para usar shadcn/ui en frontend
**Contexto:** hacía falta evitar que futuras iteraciones del frontend mezclaran componentes ad hoc con la base visual ya integrada, generando inconsistencia en la UI.
**Uso de LLM:** se le pidió a Copilot agregar una regla o skill para que el trabajo de frontend use siempre shadcn/ui como base.
**Salida del modelo:** propuso una file instruction acotada a `frontend/**/*.{ts,tsx,css}` para priorizar shadcn/ui en vistas y componentes reutilizables, manteniendo libertad para customización visual encima de esa base.
**Mi decisión:** acepté la instrucción persistente porque el por qué explícito es sostener estandarización, velocidad de desarrollo, accesibilidad y consistencia visual sin cargar reglas innecesarias en backend.
**Alternativa descartada:** convertirlo en skill on-demand o ponerlo como instrucción global del workspace (descartado porque esto debe aplicar siempre en frontend, pero no tiene sentido contaminar tareas no relacionadas con UI).

###[Decisión] DEC-0018 - Reconstrucción total del frontend con el CLI oficial de shadcn/ui
**Contexto:** hacía falta rehacer el frontend desde una base limpia porque la integración manual previa no era reconocida por el CLI oficial de shadcn/ui y eso bloqueaba el flujo estándar de scaffolding.
**Uso de LLM:** se le pidió a Copilot borrar el frontend actual y reconstruirlo con la documentación oficial usando `npx shadcn@latest init -t next`.
**Salida del modelo:** propuso limpiar el directorio `frontend/`, ejecutar el scaffold oficial de Next.js + shadcn/ui, reacomodar la salida al layout esperado del repo y restaurar Docker/ajustes del proyecto alrededor de esa nueva base.
**Mi decisión:** acepté rehacerlo desde cero porque el por qué explícito es alinear el proyecto con el flujo oficial de shadcn/ui, reducir desviaciones manuales y dejar una base más mantenible para los siguientes componentes del frontend.
**Alternativa descartada:** seguir iterando sobre la instalación manual anterior (descartado porque el propio CLI no la detectaba como framework soportado y eso seguía dejando una base inconsistente respecto a la documentación oficial).

###[Decisión] DEC-0019 - Tipos compartidos generados desde OpenAPI del backend
**Contexto:** hacía falta evitar drift entre el contrato del backend FastAPI y los tipos usados por el frontend, especialmente para tickets y webhook.
**Uso de LLM:** se le pidió a Copilot proponer una estrategia end-to-end para OpenAPI/tipos compartidos y generar la base de implementación porque el objetivo era eliminar tipos duplicados manuales.
**Salida del modelo:** propuso exportar `openapi.json` desde FastAPI, generar un archivo TypeScript compartido con `openapi-typescript`, crear un cliente tipado en el frontend y usarlo en la página principal para consumir tickets reales.
**Mi decisión:** acepté la estrategia y la ajusté para que el webhook declare su request body tipado en FastAPI, porque el por qué explícito es que el contrato generado refleje exactamente el backend y no dependa de tipos escritos a mano en dos lugares.
**Alternativa descartada:** definir interfaces manuales en el frontend o duplicar DTOs por dominio (descartado por mayor riesgo de desalineación y mantenimiento doble).

###[Decisión] DEC-0020 - Pruebas unitarias de frontend con Jest + Testing Library
**Contexto:** hacía falta incorporar una base de pruebas unitarias en frontend para validar componentes y utilidades antes de ampliar cobertura funcional.
**Uso de LLM:** se le pidió a Copilot implementar pruebas unitarias en frontend con preferencia explícita por Jest y dejarlo listo para integración en PR.
**Salida del modelo:** propuso configurar `next/jest` con `jsdom`, setup global para `@testing-library/jest-dom`, scripts de test (`test`, `test:watch`, `test:coverage`) y pruebas iniciales para utilidades (`cn`), cliente API (`getTickets`) y componente `Button`.
**Mi decisión:** acepté Jest como base de unit testing en frontend porque el por qué explícito indicado fue la preferencia de usar Jest para este tipo de pruebas y su integración directa con Next.js mediante `next/jest`.
**Alternativa descartada:** usar Vitest para pruebas unitarias (descartado en esta etapa para respetar la preferencia de stack y evitar mezclar runners en el mismo frontend).

###[Decisión] DEC-0021 - Checks de frontend obligatorios en Pull Request
**Contexto:** hacía falta ejecutar validaciones automáticas de frontend antes del merge, similar al esquema ya aplicado en backend.
**Uso de LLM:** se le pidió a Copilot agregar workflows para testear el código de frontend en PR antes de poder hacer merge.
**Salida del modelo:** propuso un workflow dedicado de GitHub Actions para PR con cuatro jobs independientes: `lint`, `typecheck`, `unit tests` (Jest) y `docker build`, usando `actions/setup-node` + `npm ci` y control de concurrencia para cancelar ejecuciones anteriores del mismo PR.
**Mi decisión:** acepté este enfoque porque el por qué explícito indicado fue tener una barrera de calidad previa al merge en frontend, igual que backend, para detectar fallos temprano y evitar merges con regresiones.
**Alternativa descartada:** ejecutar únicamente un job de build o dejar las validaciones de frontend como ejecución manual local (descartado por menor cobertura y por no bloquear automáticamente PRs con errores).

###[Decisión] DEC-0022 - Refactor de tickets dashboard en subcomponentes
**Contexto:** el archivo del dashboard de tickets acumuló demasiada responsabilidad (filtros, tabla, paginación y lógica de orquestación), dificultando lectura y mantenimiento.
**Uso de LLM:** se le pidió a Copilot reducir más la lógica del dashboard y separarlo en componentes si era necesario.
**Salida del modelo:** propuso extraer tres piezas (`DashboardFilters`, `DashboardTable`, `DashboardPagination`) y dejar `TicketsDashboard` como orquestador de query params, estado de conexión y navegación.
**Mi decisión:** acepté la separación porque el por qué explícito fue legibilidad/mantenibilidad, manteniendo el mismo comportamiento visible y reduciendo complejidad del archivo principal.
**Alternativa descartada:** mantener toda la implementación en un solo componente con helpers internos (descartado por seguir concentrando demasiada lógica en un único archivo).

###[Decisión] DEC-0023 - Seed reproducible de tickets y comentarios demo
**Contexto:** la base de datos de desarrollo puede quedar vacía y dificulta validar dashboard, filtros, ordenamiento y timeline de comentarios sin crear datos manualmente.
**Uso de LLM:** se le pidió a Copilot crear un seed con tickets y comentarios en diferentes estados y fechas para poblar DB.
**Salida del modelo:** propuso un script ejecutable (`python -m app.seed_data`) que inserta tickets/comentarios demo con fechas variadas, en modo idempotente por defecto, y con opción `--force-reset` para reemplazar datos existentes.
**Mi decisión:** acepté esta estrategia porque el por qué explícito fue evitar una base vacía y habilitar validaciones funcionales rápidas del producto en desarrollo sin carga manual repetitiva.
**Alternativa descartada:** mantener solo inserción manual desde endpoints o SQL ad-hoc (descartado por ser lento, propenso a inconsistencias y no reproducible entre entornos).

###[Decisión] DEC-0024 - Seed configurable por volumen para pruebas de paginación
**Contexto:** para validar paginación no basta un dataset pequeño; se requiere poder generar muchos tickets en algunos escenarios, pero no siempre.
**Uso de LLM:** se le pidió a Copilot ampliar el seed para aceptar cantidad variable sin perder el modo simple por defecto.
**Salida del modelo:** propuso agregar bandera `--count` al seed para generar N tickets (replicando plantillas con variación de fechas/títulos), manteniendo idempotencia y `--force-reset`.
**Mi decisión:** acepté porque el por qué explícito fue poder crear volumen alto solo cuando se necesite testear paginación, sin forzar siempre una carga pesada de datos.
**Alternativa descartada:** dejar una cantidad fija alta en el seed base (descartado por volver lento e innecesario el flujo normal de desarrollo).

###[Decisión] DEC-0025 - Ruta SSR de detalle de ticket con comentarios
**Contexto:** hacía falta navegar desde una fila del dashboard a una vista dedicada de ticket en `/tickets/[id]`, cargando también sus comentarios para revisar el caso completo.
**Uso de LLM:** se le pidió a Copilot implementar la ruta F2 con SSR y hacer que el acceso ocurra dando click en la row del dashboard que representa el ticket.
**Salida del modelo:** propuso usar los endpoints existentes de backend para resolver en el servidor el ticket y sus comentarios, crear la ruta dinámica SSR en Next.js y conectar la navegación desde la tabla del dashboard al detalle del ticket.
**Mi decisión:** acepté este enfoque porque el por qué explícito del requerimiento fue habilitar el flujo de drill-down desde el dashboard hacia el detalle completo del ticket con comentarios, sin depender de una carga cliente posterior para ver la información principal.
**Alternativa descartada:** abrir el detalle como vista cliente o modal cargado después del click sobre el dashboard (descartado por no cumplir tan directamente el objetivo de SSR en `/tickets/[id]` y por acoplar más lógica de detalle al dashboard).
