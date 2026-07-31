# Restablecimiento de la demo

`pnpm demo:reset` intenta el endpoint protegido de reset si la API está disponible. Si no lo
está, regenera la semilla determinista local. Desde la aplicación, un administrador demo puede
usar **Configuración de demo → Restablecer**.

El reset:

- restaura materiales, solicitudes, reglas, auditoría, UAT y notificaciones;
- conserva únicamente preferencias locales de interfaz;
- no toca recursos cloud ni un SAP real;
- puede repetirse sin cambiar el resultado.

Para reiniciar también preferencias del navegador, borrar el almacenamiento del sitio o abrir
una ventana privada. El motor demo contiene 40 materiales y 8 solicitudes; el seed PostgreSQL
de desarrollo contiene 250 materiales. Todos son sintéticos.
