# Phase 14 — Header con jerarquía clara (Save/Push) + Push (Prod) más “serio”

## Alcance implementado
- Reorganicé el header para separar claramente:
  - Contexto: branch + submission environment (Dev/Prod)
  - Acciones primary: `Save all` y `Push`
  - Acciones secundarias: `What’s new` y `Current PDF`
  - Utilities: theme + user menu
- Push ahora tiene icono y tooltip más explícito en Prod (abre summary y manda a aprobación TL).

## Qué cambió
- `UnifiedHeader` agrupó acciones con separadores visuales y mejoró `focus-visible` en botones primary.
- `Push` agrega icono contextual:
  - Dev: icono “upload”
  - Prod: icono “shield/check” (aprobación)

## Evidencia visual

![Header hierarchy](../screenshots/phase-14-header-hierarchy.png)

- Qué mirar:
- Se ve el “context block” (branch + Dev/Prod) separado de `Save all` y `Push`.
- `Save all` y `Push` se leen como acciones primary (alineadas, con foco claro).
- `Push (Prod)` se diferencia por icono y se entiende como flujo de review.

## Límites scaffold
- El toggle Dev/Prod sigue siendo “submission environment”, no checkout real de branch; sólo copy/jerarquía UI.

