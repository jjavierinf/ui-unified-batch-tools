# 2026-02-11 — Phase 3 Information Architecture Refactor

Alcance implementado:
- Tab top-level renombrada a `SQL Explorer`.
- `Pipelines` ahora contiene submodos `Simple` y `Pro`.
- Persistencia de submodo de pipelines en store.
- Compatibilidad de rutas existentes (`/editor`, `/pipelines`) mantenida.

## Qué cambió

### Top-level navigation
- Se actualizó el header principal para mostrar `SQL Explorer` en lugar de `SQL Editor`.
- Se mantuvo la clave interna `code` para no romper estado persistido ni rutas existentes.

### SQL Explorer mock (1 conexión)
- Se agregó una franja informativa en Code View con:
  - `Mock Connection: demo_sqlserver_primary`
  - `Read/Write scaffold mode`
- Esto deja explícito que el explorer está en modo demo y con una única conexión mock.

### Pipelines submodes (Simple / Pro)
- Se agregó `pipelineSubMode` en `workspace-store` con persistencia (`simple` por default).
- `PipelineView` ahora renderiza tabs de submodo:
  - `Simple`: vista resumida orientada a navegación.
  - `Pro`: vista completa previa con overview/detail editable.
- En `Simple` se agregó CTA `Open in Pro` por pipeline para pasar al modo detallado.

## Evidencia visual

### SQL Explorer (dark)
![Phase 3 SQL Explorer dark](../screenshots/phase3-sql-explorer-dark.png)

Qué mirar:
- El tab superior dice `SQL Explorer`.
- Se ve `Mock Connection: demo_sqlserver_primary`.
- Se ve `Read/Write scaffold mode`.

### Pipelines Simple (dark)
![Phase 3 Pipelines Simple dark](../screenshots/phase3-pipelines-simple-dark.png)

Qué mirar:
- Tab de submodo con `Simple` activo.
- Encabezado `Pipelines Simple`.
- Botones `Open in Pro` por pipeline.

### Pipelines Pro (dark)
![Phase 3 Pipelines Pro dark](../screenshots/phase3-pipelines-pro-dark.png)

Qué mirar:
- Tab de submodo con `Pro` activo.
- Vista de tabla/overview completa del modo Pro.
- Indicador de persistencia de submodo (`Pipeline submode persisted`).

## Límites scaffold
- `SQL Explorer` sigue sin ejecución real contra motor (mock explícito).
- No se agregó backend nuevo para conexiones múltiples.

## TODO hooks
- Migrar `PipelineOverview` para soportar filtros/agrupaciones avanzadas solicitadas en fase 4.
- Evaluar deep-link por submodo (`/pipelines?mode=simple|pro`) si se necesita compartir vistas exactas.

## Calidad
- `cd ui && npm run lint` (sin errores; warnings existentes no bloqueantes).
- `cd ui && npm run build` (ok).
- Validación visual en Chrome vía Playwright (capturas dark mode).

## Commit de fase
- _pendiente_
