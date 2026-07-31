# ADR-002: Pinia para estado compartido

- Estado: Aceptada
- Fecha: 2026-07-30

Pinia gestiona sesión, preferencias, notificaciones y el estado compartido de una operación. Las
listas paginadas y el estado efímero permanecen fuera de stores globales. Esto reduce acoplamiento
y evita stores gigantes, a cambio de exigir límites claros por feature.
