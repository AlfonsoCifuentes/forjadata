# Arquitectura Azure y coste

La infraestructura Bicep/AZD prepara una topología P1 de bajo tráfico y sin secretos estáticos:

- Azure Functions en plan Consumption;
- Storage GPv2 con lifecycle y contenedores privados;
- Service Bus Basic;
- PostgreSQL Flexible Server B1ms, 32 GiB, con horario de apagado documentado;
- Application Insights/Log Analytics con muestreo y retención reducidos;
- identidad administrada y RBAC;
- Document Intelligence y Azure OpenAI deshabilitables por parámetro;
- Static Web Apps como artefacto Azure, mientras la demo pública se publica en Vercel.

## Guardrails de la prueba gratuita

- Suscripción Free Trial con `spendingLimit=On`; nunca se retira ni se convierte a pago por uso.
- Presupuesto personal: EUR 0. El crédito promocional no autoriza sobrecostes.
- Un único entorno `dev`, SKU mínimos, sin réplicas, Premium, Kubernetes ni redes costosas.
- IA limitada a `gpt-5-mini` con 1K TPM y desactivable.
- Email cloud desactivado salvo configuración deliberada.
- Preview/what-if debe mostrar cero borrados antes de desplegar.

La estimación de bajo tráfico es USD 20–25/mes, consumida por el crédito promocional mientras
esté vigente. El estado real de provisionamiento y los comandos ejecutados se mantienen en
[`IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md) y
[`infra/README.md`](../../infra/README.md).
