# ADR-005: PostgreSQL y Prisma

- Estado: Aceptada
- Fecha: 2026-07-30

PostgreSQL es la persistencia objetivo por su modelo relacional, índices y extensiones de
búsqueda. Prisma aporta migraciones y consultas tipadas. El modo demo usa un repositorio en
memoria con el mismo puerto para evitar que Docker o una base cloud bloqueen la evaluación.
