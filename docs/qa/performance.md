# Rendimiento

`pnpm test:performance` construye la SPA y ejecuta tres auditorías Lighthouse desktop contra un
servidor estático efímero. La prueba falla por debajo de 0,90 en:

- performance;
- accessibility;
- best practices;
- SEO.

Los informes JSON y HTML quedan en `.lighthouseci/`. El runner usa un perfil explícito para
evitar una carrera de limpieza conocida de Chrome en Windows; un bloqueo residual solo genera
un aviso después de escribir los informes.

Último cierre local, tres de tres ejecuciones: 1,00 en las cuatro categorías. Una ejecución
representativa registró FCP 0,6 s, LCP 0,7 s, TBT 10 ms y CLS 0.

## Presupuesto técnico

- Bundle inicial: aproximadamente 102 KiB minificado / 35 KiB gzip.
- AG Grid, ECharts y Three.js se cargan únicamente al visitar su pantalla.
- FCP objetivo: < 1,8 s en preset desktop.
- LCP objetivo: < 2,5 s.
- TBT objetivo: < 200 ms.
- CLS objetivo: < 0,1.

Los chunks lazy de proveedores pueden superar 500 KiB minificados; se acepta porque no forman
parte de la entrada y dividirlos internamente aumentaría complejidad sin mejorar el flujo de
reclutador.
