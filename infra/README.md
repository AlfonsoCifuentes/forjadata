# Infraestructura Azure de Forjadata

Esta carpeta despliega una única instancia de portfolio, reproducible con Azure Developer CLI
y Bicep. El diseño parte de las plantillas oficiales de Azure Functions TypeScript para HTTP
y Service Bus y conserva sus patrones de Flex Consumption, identidad administrada y RBAC.

## Límite financiero

El entorno `forjadata-dev` está destinado exclusivamente a la suscripción Azure Free Trial.
No se debe retirar su `spendingLimit`, convertirla a pago por uso ni duplicar el entorno. El
límite de gasto de la suscripción es la barrera que impide un cargo personal; las cuotas de
aplicación reducen el consumo del crédito, pero no sustituyen esa barrera.

| Servicio              | Configuración de coste                                |
| --------------------- | ----------------------------------------------------- |
| Static Web Apps       | Free                                                  |
| Functions             | Flex Consumption FC1, 2 GiB, máximo 3 instancias      |
| Storage               | Standard LRS, hot, sin claves compartidas             |
| Service Bus           | Basic, dos colas                                      |
| PostgreSQL            | B1ms, 32 GiB, 7 días, sin HA ni backup georredundante |
| Document Intelligence | F0                                                    |
| Azure OpenAI          | `gpt-5-mini`, GlobalStandard, 1K TPM en East US 2     |
| Log Analytics         | 30 días, tope de ingesta 0,1 GB/día                   |
| Key Vault             | Standard, un secreto                                  |

El núcleo se crea en `eastus2`: el preflight de Azure rechazó West Europe para nuevos clientes
de esta Free Trial y validó el grafo completo en East US 2. PostgreSQL se crea en
`northeurope`, donde la oferta permite B1ms. La regla PostgreSQL
`0.0.0.0` permite conexiones desde servicios Azure; es una concesión consciente para evitar
el coste fijo de red privada en este portfolio sintético.

## Estructura

- `main.bicep`: resource group, identidad, plan y composición.
- `main.parameters.json`: parámetros AZD; no contiene secretos.
- `modules/`: un módulo por servicio.
- `parameters/`: ejemplos para Bicep CLI; `prod.example` no debe ejecutarse en Free Trial.

El password de administración PostgreSQL se genera como parámetro seguro durante el
deployment, se guarda en Key Vault y la Function recibe únicamente una referencia de Key
Vault. No se imprime ni se devuelve como output.

## Validación

```powershell
pnpm infra:validate
azd env select forjadata-dev
azd provision --preview --no-prompt
```

`pnpm infra:validate` compila Bicep y bloquea regresiones de coste o identidad. Antes de
aprovisionar se debe ejecutar el workflow `azure-validate`, incluida la vista previa/what-if.

## Despliegue y empaquetado

`postgresAdministratorPassword` es un parámetro `@secure()` sin valor por defecto: se toma de
`POSTGRES_ADMIN_PASSWORD` en el entorno de AZD. Debe fijarse una sola vez por entorno para que
`azd provision` sea idempotente y no rote la credencial en cada ejecución. El valor queda en
`.azure/<entorno>/.env`, que está excluido de Git.

```powershell
azd env set POSTGRES_ADMIN_PASSWORD '<contraseña de 16+ caracteres>'
azd provision --no-prompt
azd deploy --no-prompt
```

El hook `prepackage` genera `apps/api/deploy`: un artefacto autocontenido con las funciones
HTTP y Service Bus. La SPA se compila con las salidas `VITE_*` de Bicep. SAP permanece
deshabilitado en Azure mientras no haya endpoint y credenciales reales; el entorno cloud no
finge una sincronización.

## Verificación posterior

1. Consultar `GET $API_URL/health` y `GET $API_URL/integrations`.
2. Iniciar sesión por Entra en `$WEB_URL`.
3. Cargar un PDF pequeño y comprobar Blob → Service Bus → worker → Document Intelligence →
   Azure OpenAI → PostgreSQL.
4. Confirmar trazas correlacionadas en Application Insights.
5. Revisar coste real y saldo de Free Trial.

## Retirada

La retirada es una única operación recuperable solo mediante un nuevo despliegue:

```powershell
azd down --purge --force --no-prompt
```

Antes de ejecutarla, confirmar que `AZURE_ENV_NAME=forjadata-dev` y que el resource group
resuelto es `rg-forjadata-forjadata-dev`. Key Vault tiene purge protection y puede conservar
metadatos durante su retención aunque el resource group se elimine.
