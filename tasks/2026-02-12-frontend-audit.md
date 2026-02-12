# Frontend Audit (12-feb) — UI Scaffold “Pro Polish” (Sin Regresiones)

## Objetivo
- Detectar fricciones visuales/UX “se ve mock / se entiende poco / no es pro” en surfaces clave (phases 1–12).
- Anticipar objeciones de review típicas (copy, consistencia Simple/Pro, claridad Dev/Prod, credibilidad de mock).
- Convertir findings en fases ejecutables con evidencia (`docs/changelogs/*.md + *.pdf` + screenshots dark con “Qué mirar”).

## Contexto / Constraints
- El scaffold prioriza UX realista; backend real (PRs, ejecución real de queries) sigue mock.
- `docs/CHANGELOG.md` es append-only; la evidencia por iteración va a `docs/changelogs/`.
- Dark theme default y screenshots siempre dark cuando sea posible.
- No scope: mobile/responsive salvo bug que rompa desktop.

## Findings (P0/P1/P2)

### P0 — Confusión fuerte / baja credibilidad demo
- Estados internos visibles como enums crudos en puntos críticos (ej: modal de Prod muestra `pending_approval` literal).
- Mensajería de “Diff” en el modal es binaria (“clean/has diff”) pero no es accionable ni consistente con el resto.

### P1 — UX mejorable / “se ve scaffold” pero no rompe
- Header: demasiadas acciones con jerarquía similar; Dev/Prod + Push podría leerse como “checkout de branch”.
- Pipeline cards: config se puede abrir, pero falta “resumen” para entender rápido el tipo de task y lo importante de su config (especialmente DQA tipo 2 vs 3).
- SQL Explorer: click en schema hace toggle + setQuery al mismo tiempo; sorprende (no “DBeaver muscle memory”).
- Manage connections: faltan guardrails de UX (validación, empty state, confirm delete en caso activo).
- Safety enforcement: bloqueo está “técnico”; falta callout más product-like y un “qué hacer”.
- Default LIMIT: falta affordance clara para aplicar sugerencia (sin reescribir automáticamente).

### P2 — Pulido / storytelling
- Joyride: orden de historia puede mejorar (crear pipeline -> config -> save -> push -> review -> safety).
- Fallbacks cuando no hay pendientes: deben guiar al usuario a generar un review sin trabar el tour.

## Objeciones probables en próximos reviews (para anticipar)
- “No entiendo qué significa Submitted vs Pending Review sin conocer el modelo interno”.
- “Prod push debería sentirse más ‘serio’ (aprobación TL)”.
- “DQA se entiende, pero quiero ver claro qué cambia entre rule-check y source-vs-target sin abrir YAML”.
- “SQL Explorer está bueno, pero los clicks no se comportan como DBeaver”.
- “Safety bloquea, pero no me dice qué hacer para destrabar”.

## Fix Plan por fases (ejecutables)
- P0.1: Status labels/copy humanos + consistencia de “Diff”.
- P0.2: Jerarquía visual en header (Primary/Secondary/Utility) + copy/tooltips Dev/Prod.
- P1.1: Pipeline cards con micro-resumen de config (incluye DQA tipo 2 vs 3).
- P1.2: SQL Explorer: separar expand/collapse vs open query + breadcrumb/active selection.
- P1.3: Manage connections: validación, empty state, confirm delete si activa.
- P1.4: Safety: callouts accionables + botón “Apply LIMIT” + naming consistente.
- P2: Joyride: reordenar steps y harden de fallbacks.

## No-regression checklist (se corre por fase)
- user: editar SQL -> Save all -> Push (Dev)
- user: Prod -> Push -> modal -> confirm -> pending_approval
- leader: Reviews -> Approve / Request Changes
- Pro: folder focus -> pipeline summary -> abrir SQL -> editar params
- SQL Explorer: add/edit/remove conn -> run query -> browse schema/table
- Safety: cambiar thresholds -> bloquear/desbloquear determinísticamente

