# Phase 20 — SQL Explorer “Database Navigator” look (más DBeaver)

## Alcance implementado
- Re-trabajé el sidebar para que se note explícitamente que es un **DB Explorer**:
  - título “Database Navigator”
  - header de connection con el **host alineado a la derecha**
  - iconografía por tipo: database / schema / table
  - filtro “Filter db/schema/table...” para navegar rápido
- Mantiene el comportamiento de clicks (schema -> tables query, table -> columns query).

## Qué cambió
- `CodeView` reorganizó el layout del sidebar (sin tocar el mock runner).
- `SchemaBrowser` ahora renderiza iconos y aplica filtro a db/schema/table.

## Evidencia visual

![Database Navigator look](../screenshots/phase-20-sql-explorer-dbeaver-look.png)

- Qué mirar:
- Se ve “Database Navigator” y un header de connection con el host a la derecha.
- El tree tiene iconos: cilindro (db), folder (schema), grilla (table).
- El input de filtro sugiere navegación tipo DB client (no file tree).

## Límites scaffold
- No hay ejecución real de queries ni metadata real; el objetivo es UX creíble (mock).

