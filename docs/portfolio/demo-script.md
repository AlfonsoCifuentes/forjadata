# Guion de demostración

## Preparación

Ejecutar `pnpm demo:reset`, abrir la URL y comprobar que aparece **Modo demo**. Usar reviewer.
No introducir datos reales.

## Versión de 90 segundos

| Tiempo  | Acción                           | Mensaje                                                                  |
| ------- | -------------------------------- | ------------------------------------------------------------------------ |
| 0–08 s  | Landing → Entrar en modo demo    | “Forjadata transforma documentos en datos maestros fiables.”             |
| 08–18 s | Dashboard                        | “KPIs sintéticos muestran volumen, calidad y cuello de botella.”         |
| 18–32 s | Nueva solicitud + documento demo | “El formulario tipado inicia un pipeline trazable.”                      |
| 32–46 s | Abrir solicitud procesada        | “Cada sugerencia incluye confianza y evidencia; una persona decide.”     |
| 46–57 s | Resolver candidato duplicado     | “El score se desglosa y la resolución queda auditada.”                   |
| 57–68 s | Aprobar                          | “RBAC y la máquina de estados impiden transiciones inválidas.”           |
| 68–77 s | Sincronizar con SAP Simulator    | “El adaptador valida, usa idempotencia y conserva correlación.”          |
| 77–84 s | Auditoría                        | “Actor, cambio, versión y correlation ID permiten reconstruirlo.”        |
| 84–90 s | Cómo está construido             | “Vue, Functions, adapters, pruebas y Bicep forman un sistema coherente.” |

## Versión de tres minutos

1. Repetir la apertura y explicar que los datos son sintéticos.
2. Mostrar filtros del dashboard y catálogo AG Grid.
3. Crear una solicitud y señalar documento, progreso y notificación.
4. Revisar evidencia, modificar un valor y resolver el duplicado.
5. Cambiar temporalmente a requester para demostrar permiso denegado.
6. Volver a reviewer, aprobar y abrir el centro SAP.
7. Mostrar payload, resultado, idempotency key y acción de reintento.
8. Abrir auditoría, UAT y arquitectura.
9. Cerrar con pruebas, modos reales/simulados y guardrails de coste.

Mensaje final: “Forjadata no es solo una interfaz de IA. Es una SPA empresarial con estado,
permisos, REST, procesos asíncronos, validación, auditoría, testing y una arquitectura preparada
para Azure y SAP.”
