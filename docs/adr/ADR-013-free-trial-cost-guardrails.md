# ADR-013: Guardas de coste para Azure Free Trial

- Estado: Aceptada
- Fecha: 2026-07-30

## Contexto

La suscripción objetivo es `FreeTrial_2014-09-01`, dispone de crédito promocional y mantiene
`spendingLimit = On`. El propietario no acepta ningún cargo personal.

## Decisión

Se despliega un solo entorno de desarrollo con SKUs gratuitos o mínimos, escalado acotado,
retención baja y sin red privada, alta disponibilidad, redundancia geográfica ni servicios
dedicados. El spending limit no se modifica y la suscripción no se actualiza a pago por uso.

Azure rechazó West Europe para nuevos clientes de esta Free Trial durante
`az deployment sub validate`. El núcleo usa East US 2, donde el grafo completo validó y existe
cuota de modelo. PostgreSQL usa B1ms/32 GiB en North Europe, donde la oferta permite ese SKU.
La aplicación limita documentos a 10 MB, entrada del modelo a 30.000 caracteres, salida a
1.500 tokens y el deployment a 1K TPM.

## Consecuencias

- La plataforma se detendrá cuando venza o se agote la prueba en vez de generar sobrecoste.
- La arquitectura no promete disponibilidad de producción.
- La base de datos y la API son multirregión por una restricción de oferta; la latencia es
  aceptable para un portfolio, no para producción.
- PostgreSQL acepta tráfico desde servicios Azure mediante firewall público; los datos son
  exclusivamente sintéticos.
- Budgets y alertas son informativos; el spending limit es la protección financiera efectiva.
