---
applyTo: "frontend/**/*.{ts,tsx,css}"
description: "Usar shadcn/ui como base para cualquier trabajo de UI en frontend. Aplica al crear vistas, layouts, formularios, tablas, dialogs, feedback states y componentes reutilizables en Next.js."
---

# Regla de base UI para frontend

- En `frontend/`, usar siempre componentes de shadcn/ui como base para la interfaz cuando exista una pieza equivalente.
- Antes de crear UI bespoke, revisar si puede resolverse componiendo componentes en `components/ui/`.
- Si un componente de shadcn/ui aun no existe en el repo, agregarlo siguiendo el patron de shadcn y reutilizar `@/lib/utils` con `cn`.
- Evitar construir botones, cards, inputs, dialogs, tables, badges, tabs o formularios desde cero si pueden salir de la base de shadcn/ui.
- Mantener consistencia con los tokens visuales definidos en `app/globals.css` y `tailwind.config.ts`.
- Se permite CSS personalizado para layout, branding y composicion, pero la base interactiva y estructural debe partir de shadcn/ui.
- Solo desviarse de esta regla si hay una limitacion tecnica clara o un requisito de diseno que shadcn/ui no cubra razonablemente; en ese caso, explicarlo.
