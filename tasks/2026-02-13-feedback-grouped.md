# Feedback grouped — 13-feb (post phase-21)

## Scope (nuevo)
- Privacy/demo hygiene:
  - Renombrar pipelines, integrations, tablas y queries a nombres **genéricos** (sin hints del modelo de datos real).
- UX consistency:
  - En **Pro**, la lista de tasks debe verse como **Simple** (cards grandes, mismos affordances).
- DQA realism:
  - DQA tipo A (rule check, 1 query): **1 task = 1 file**.
  - DQA tipo B (source vs target, counts): **1 task = 2 files** (source + target) y al click debe abrir **split editor**.
  - Debe soportar cualquier combinación de tasks A/B por pipeline.

## Non-goals
- Ejecución real contra DB o comparación real de resultados (seguimos mock).
- Reescritura de stores/backends; cambios deben ser incrementales y scaffold-friendly.

## Riesgos de regresión
- Mapping de “selected file -> pipeline context” cuando una task referencia 2 files.
- Seeding de pipelines (create pipeline) y el repo fixture (`scripts/setup-test-repo.sh`) deben quedar alineados.

