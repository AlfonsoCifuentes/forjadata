# Despliegue

## Vercel

`vercel.json` construye `apps/web` y publica `apps/web/dist` como SPA demo. No contiene secretos
ni conecta automáticamente la demo pública con Azure.

## Azure

La secuencia controlada es:

```bash
azd auth login
azd env select forjadata-dev
azd provision --preview --no-prompt
azd provision --no-prompt
azd deploy --no-prompt
```

Antes de ejecutar se comprueba suscripción Free Trial, spending limit, what-if, regiones y
SKUs. Después se validan health, CORS, Blob, cola, identidad, PostgreSQL, telemetría y auth
Entra. No se habilita Azure Communication Services ni SAP OData sin credenciales deliberadas.

El despliegue se detiene si exige retirar el límite de gasto o convertir la cuenta a pago por
uso. El estado y las URLs verificadas se anotan en `IMPLEMENTATION_STATUS.md`.
