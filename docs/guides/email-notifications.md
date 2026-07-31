# Notificaciones por email

El canal in-app es obligatorio y funciona siempre. El email es opcional según la
especificación maestra y se ejecuta detrás de `NotificationEmailPort`; un fallo de entrega no
revierte una solicitud ya procesada ni una sincronización ya registrada.

## Modos

| `EMAIL_MODE`                   | Comportamiento                                                      |
| ------------------------------ | ------------------------------------------------------------------- |
| `disabled`                     | No intenta enviar y publica salud `unconfigured`.                   |
| `log`                          | Simulador local explícito; registra plantilla y correlation ID.     |
| `azure-communication-services` | Adaptador real de Azure Communication Services Email con identidad. |

El despliegue Azure mantiene `EMAIL_MODE=disabled` por defecto. No se aprovisiona un dominio,
no se elige un destinatario personal y no se incurre en consumo de email sin una decisión
explícita del operador. Esto no se presenta como una integración activa.

## Configuración real

El adaptador real utiliza `EmailClient` y `DefaultAzureCredential`, por lo que no necesita
guardar una clave en el repositorio. Requiere:

```dotenv
EMAIL_MODE=azure-communication-services
AZURE_COMMUNICATION_EMAIL_ENDPOINT=https://<communication-resource>.communication.azure.com
AZURE_COMMUNICATION_EMAIL_SENDER=DoNotReply@<verified-domain>
NOTIFICATION_EMAIL_RECIPIENT=<intentional-test-recipient>
EMAIL_TIMEOUT_MS=15000
PUBLIC_APP_URL=https://<forjadata-host>
```

Antes de habilitarlo:

1. crear o seleccionar un recurso de Communication Services y un dominio de envío verificado;
2. conceder a la identidad administrada de Functions el permiso de envío indicado por la
   documentación vigente de Azure Communication Services;
3. elegir deliberadamente un destinatario sintético o controlado;
4. efectuar un envío de smoke y comprobar que la salud cambia de `degraded` a `healthy`;
5. revisar Cost Management y conservar el spending limit de Free Trial activado.

No se debe usar una dirección descubierta en Entra como destinatario implícito.

## Contrato y seguridad

Los mensajes admiten las plantillas de procesamiento y sincronización, asunto, texto, enlace y
correlation ID. El HTML escapa todos los valores, el envío tiene timeout y solo registra tipo
de error, nunca cuerpo, dirección ni credenciales. `healthCheck` no afirma que el canal esté
sano hasta que un envío real termina con `Succeeded`.

```bash
pnpm --filter @forjadata/api test:run
```

Las pruebas de contrato cubren los modos `disabled` y `log`, el payload real mediante un
cliente inyectado, el escape HTML y la degradación controlada ante fallos.
