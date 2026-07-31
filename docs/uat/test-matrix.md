# Matriz UAT

| ID     | Rol            | Escenario                               | Resultado esperado                                  |
| ------ | -------------- | --------------------------------------- | --------------------------------------------------- |
| UAT-01 | requester      | Crear, guardar y enviar solicitud       | Pipeline termina en revisión con notificación       |
| UAT-02 | reviewer       | Aceptar/modificar sugerencias           | Valores y evidencia quedan auditados                |
| UAT-03 | reviewer       | Resolver duplicado                      | Decisión humana visible y persistida                |
| UAT-04 | requester      | Intentar aprobar                        | Backend devuelve permiso denegado                   |
| UAT-05 | reviewer       | Aprobar solicitud válida                | Estado pasa a aprobada y habilita SAP               |
| UAT-06 | sap_specialist | Sincronizar payload válido              | SAP ID, correlación y duración registrados          |
| UAT-07 | sap_specialist | Reintentar fallo recuperable            | Mismo idempotency key; intento incrementado         |
| UAT-08 | admin          | Crear y versionar regla avanzada        | AST válido, control optimista y auditoría           |
| UAT-09 | uat_tester     | Ejecutar escenario y adjuntar evidencia | Resultado y binario aparecen en el informe          |
| UAT-10 | admin          | Restablecer demo                        | Dataset vuelve a la semilla sin residuos            |
| UAT-11 | reviewer       | Usar teclado y cambiar ES/EN            | Flujo operable, foco visible y traducción coherente |
| UAT-12 | evaluador      | Completar guion de recruiter            | Recorrido comprensible en menos de tres minutos     |

La UI permite crear release, plan, escenarios, ejecuciones, evidencia y sign-off. El E2E cubre
el camino UAT y las reglas de dominio impiden firmar un escenario incompleto.
