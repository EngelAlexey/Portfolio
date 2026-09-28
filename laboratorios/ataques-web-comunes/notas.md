# Notas de ataques-web-comunes

Material de trabajo del artículo `src/content/articles/ataques-web-comunes`. Está fuera de `src/` para que `astro check` no revise el laboratorio.

## Laboratorio

`lab.mjs` es la aplicación del artículo: una ruta vulnerable (`/v/...`) y su corrección (`/f/...`) por ataque. Se midió en Ubuntu 26.04 sobre WSL, con Node.js 24.19.0 instalado desde el tarball oficial (comprobado con `SHASUMS256.txt`) en `~/node24`, y curl 8.18.0. Dependencias: express 5.2.1, jsonwebtoken 9.0.3 y cookie-parser 1.4.7, instaladas con `--ignore-scripts`.

- `medir.sh` genera `mediciones.txt`: todas las peticiones del artículo.
- `medir2.sh` genera `mediciones2.txt`: CSRF y SSRF después de la auditoría, más Pwned Passwords.
- `audit.sh` (`audit.txt`): `npm audit` y `npm audit signatures` con Express 4.17.1 y npm 11.17.0.
- `fabrica.sh` (`fabrica.txt`) y `jwt-texto.sh` (`jwt-texto.txt`): la cuenta de fábrica corregida y los tokens JWT tal como los escribe el artículo.

Desde `/mnt/c` el servidor tarda unos segundos en arrancar, así que los scripts esperan a que responda antes de medir.

## Verificación

- `fuentes.md`: comprobación de fuentes antes de escribir, por subagente.
- `auditoria.md`: auditoría del texto terminado, por subagente, con 107 afirmaciones. Fue la que encontró el fallo de la corrección de CSRF (`undefined !== undefined`).
- `prompt-*.txt`: la ejecución de demostración del prompt con `claude -p`: 203 s hasta la fase 3 y 596 s después de la confirmación.

## Decisión sobre las categorías de OWASP

Las familias siguen el texto de cada categoría del Top 10:2025, igual que el carrusel `social/ataques-web/`: A02 nombra las cuentas por defecto y los errores detallados, y A03 el script `postinstall` de Shai-Hulud. Las listas de CWE los asignan a otras categorías: CWE-506 a A08, CWE-1392 y 1393 a A07, CWE-209 a A10 y CWE-347 a A04. El artículo lo dice en el punto 1.

## Al publicar

1. `draft: false` y `published` con la fecha del día en `es.mdx` y `en.mdx`.
2. Ejecutar `python laboratorios/ataques-web-comunes/enlaces.py` desde la raíz. Añade los enlaces desde `como-proteger-una-pagina-web` («Por dónde seguir» y la línea de SSRF de «Qué queda fuera») y desde `revisar-codigo-generado-por-ia` («Qué corregir primero»), en los dos idiomas. No se añaden antes porque apuntarían a una página que no existe en producción.
3. Regenerar `lastmod.json` en un commit aparte.
4. Decidir si la historia y la línea 🔗 del carrusel del 2 de octubre (`social/ataques-web/publicacion.md` y Business Suite) apuntan a este artículo.
