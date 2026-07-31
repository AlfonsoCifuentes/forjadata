# Microsoft Entra: configuración operativa

El entorno `forjadata-dev` usa dos app registrations single-tenant:

- `Forjadata API (dev)`: recurso API, tokens v2, scope `access_as_user`;
- `Forjadata SPA (dev)`: cliente público sin secreto, Authorization Code + PKCE.

Los client IDs se guardan en el entorno local de AZD, no como secretos:

```powershell
azd env select forjadata-dev
azd env get-values
```

La API expone `api://<ENTRA_API_CLIENT_ID>/access_as_user`. No se habilitan implicit flow,
client secret ni fallback public client. La SPA registra el callback local
`http://localhost:5173/auth/callback`; el hook `postprovision` añade exactamente
`$WEB_URL/auth/callback` después de crear Static Web Apps.

## App roles

| Claim `roles`      | Capacidad                             |
| ------------------ | ------------------------------------- |
| `requester`        | Crear y consultar solicitudes propias |
| `business_analyst` | Analizar y preparar decisiones        |
| `reviewer`         | Revisar, corregir y aprobar           |
| `sap_specialist`   | Validar y ejecutar SAP                |
| `uat_tester`       | Ejecutar UAT y firmar                 |
| `admin`            | Administración completa               |

El usuario que creó las aplicaciones tiene asignado `admin` para la prueba técnica. La API no
acepta un token que carezca del scope o de un app role válido.

## Manifiestos reproducibles

- `.azure/entra-api-roles.json`: IDs estables de roles.
- `.azure/entra-api-settings.json`: scope delegado y access tokens v2.
- `.azure/entra-spa-settings.json`: configuración PKCE local.

No contienen secretos. Para reconstruir las aplicaciones en otro tenant hay que crear dos
registros nuevos, aplicar estos manifiestos, conceder el scope a la SPA y asignar usuarios o
grupos a los roles apropiados.

## Comprobación

1. Abrir la SPA y elegir acceso enterprise.
2. Completar el login del tenant.
3. Verificar en DevTools que se solicita `access_as_user`.
4. Consultar `GET /api/v1/session`; debe indicar `mode: entra` y el role asignado.
5. Retirar temporalmente el role de un usuario de prueba; la API debe responder 403
   `missing_role`.

Los JWT se validan mediante JWKS y se comprueban firma, issuer, audience, expiración, scope y
role. La SPA no almacena ni conoce credenciales confidenciales.
