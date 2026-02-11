# 2026-02-11 — Phase 1 Navigation Foundation

Alcance implementado:
- Selección de carpeta en file tree.
- Sidebar redimensionable en Code Mode.
- Consistencia de Quick Open entre modos.

## Qué cambió
- El árbol ahora soporta selección explícita de carpetas (`selectedFolder`) además de expand/collapse.
- Se agregó separator draggable para resize entre sidebar y editor, con persistencia del ancho.
- Se mejoró truncado/legibilidad de nombres largos en el file tree.
- Quick Open ahora filtra DDL y al abrir resultado vuelve a modo `code` para mantener flujo consistente.

## Evidencia visual

### Folder selection
![Folder selection](../screenshots/phase1-folder-selection.png)

### Resizable sidebar
![Resizable sidebar](../screenshots/phase1-resizable-sidebar.png)

### Quick open cross-mode
![Quick open cross-mode](../screenshots/phase1-quick-open-cross-mode.png)

## Límites scaffold
- Sin integración backend nueva en esta fase.
- TODO para fase siguiente: usar `selectedFolder` para abrir DAG config al seleccionar root en `Pipelines Pro`.

## Calidad
- `cd ui && npm run lint` (sin errores, warnings existentes no bloqueantes).
- `cd ui && npm run build` (ok).

## Commit de fase
- `693932f`
