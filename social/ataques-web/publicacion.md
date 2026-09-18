# ¿Cuáles son los ataques web más comunes?

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 14 ataques, en el orden del OWASP Top 10:2025, y el resumen los repite todos con la forma de evitarlos:
- **Acceso (A01):** IDOR, CSRF, SSRF y recorrido de rutas (`../`).
- **Instalar y configurar (A02 y A03):** paquete malicioso, versión vulnerable, cuenta de fábrica y error detallado.
- **Inyección (A05):** SQL, XSS y órdenes del sistema.
- **Cuentas (A07):** fuerza bruta, suplantación y robo de sesión.

Ninguna lámina lleva una carga de ataque de ejemplo: cada fila dice qué hace el ataque y cómo se evita.

## Portada

- **Color: magenta**, con violeta e índigo en el resto de láminas. La primera versión iba en ocre, pizarra y carmín; el 17 de septiembre Alex pidió una paleta más bonita aunque repitiera el color de otra portada. La magenta coincide con `pagina-web/`, pero en la cuadrícula solo quedan en diagonal.
- **Encuadre.** El título ocupa tres renglones, y todo el contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.
- **Sin siglas.** La portada no nombra OWASP; la lista se presenta en el texto de la publicación.

## Texto de la publicación

```
¿Cuáles son los ataques web más comunes? 🛡️💻

OWASP, una fundación sin ánimo de lucro dedicada a la seguridad del software, los ordena en su Top 10 con datos de más de 2,8 millones de aplicaciones. En la edición 2025, el primer puesto es para los fallos de control de acceso, la categoría con más casos en esos datos: más de 1,8 millones.

En este carrusel te comparto 14 ataques en cuatro familias, qué hace cada uno y cómo se evita.

⚠️ Un detalle de seguridad: según NordPass, «123456» fue otra vez la contraseña más común del mundo en 2025. La verificación en dos pasos frena la fuerza bruta aunque la contraseña sea débil.

👉 ¡Desliza y guarda la última lámina!
🔗 Cómo se ve una inyección SQL en el código, en alexherrera.dev/es/blog/revisar-codigo-generado-por-ia (link en bio).

¿Cuál de estos ataques no conocías? ¡Te leo en los comentarios! 👇💬

#Ciberseguridad #DesarrolloWeb #OWASP #Programacion
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿Cómo se ve una inyección SQL?».
- **Adhesivo de enlace.** Con el texto «Leer el artículo» y esta dirección, que apunta a la sección 3:
  `https://www.alexherrera.dev/es/blog/revisar-codigo-generado-por-ia?utm_source=instagram&utm_medium=story&utm_campaign=ataques-web#3-la-consulta-se-arma-concatenando`
- **Después.** Guardar la historia en la destacada del artículo.

El temario enlaza este carrusel con «¿Cómo funcionan las cookies?», que está sin escribir. La sección 3 de «Siete cosas que revisar» enseña la consulta armada concatenando, que es la inyección SQL de la lámina 4.

## Programación

Programado en Meta Business Suite el 17 de septiembre de 2026 para el viernes 2 de octubre, 1:00 p. m. Es la primera de la segunda tanda, detrás de `permisos-linux/`. «Active times» sugería ese día jueves a las 2:00 p. m., viernes a la 1:00 p. m. y lunes a las 7:00 p. m.; como la fecha queda fuera de su ventana, se repitió la hora sugerida para los viernes. La historia se sube a mano ese mismo día.

## Auditoría

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| OWASP es una fundación sin ánimo de lucro dedicada a la seguridad del software | owasp.org/about: «a 501(c)(3) nonprofit foundation that works to improve the security of software» | Correcta |
| El Top 10:2025 se hizo con datos de más de 2,8 millones de aplicaciones | Introducción del Top 10:2025: datos de «over 2.8 millions applications». Ocho categorías salen de los datos y dos de una encuesta | Correcta. Por eso el texto dice «con datos», sin decir que todo el orden sale de ellos |
| El primer puesto es el control de acceso, la categoría con más casos en los datos: más de 1,8 millones | A01:2025: «This category has the highest number of occurrences in the contributed data», y 1.839.701 en la tabla de puntuación | Correcta. El texto de A01 dice también que el 100 % de las aplicaciones probadas tenía algún fallo de este tipo, pero la tabla da una incidencia media del 3,74 % y ese 100 % coincide con la cobertura máxima. Por eso no se usa |
| Orden de las familias: acceso, configuración y dependencias, inyección y cuentas | A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A05 Injection, A07 Authentication Failures | Correcta |
| IDOR: otro id en la URL devuelve datos ajenos; se evita comprobando el dueño | A01:2025: el ejemplo del parámetro `acct` cambiado a mano, CWE-639 en la categoría, y «enforce record ownership» | Correcta |
| CSRF: otra web actúa con tu sesión abierta; se evita con un token CSRF | Ficha de OWASP sobre CSRF: una web «tricks an authenticated user's web browser into performing an unwanted action», y el token como defensa principal. SameSite es solo defensa en profundidad | Correcta. Por eso la lámina no nombra SameSite |
| SSRF: el servidor abre la URL que da el atacante; se evita con destinos permitidos | Ficha de OWASP sobre SSRF: el usuario controla una URL que la aplicación pide, y «Match the host against an allowlist» | Correcta |
| `../`: sale de la carpeta prevista; se evita validando la ruta | OWASP, «Path Traversal»: acceder a archivos fuera de la carpeta raíz con «dot-dot-slash (../)»; aceptar solo entradas conocidas y normalizar la ruta | Correcta |
| Paquete malicioso: ejecuta código al instalarse; se evita revisándolo y bloqueando sus scripts | A03:2025: el gusano Shai-Hulud (2025) usó «a post-install script». Artículo de npm, secciones 1 y 7 | Correcta |
| CVE: una dependencia con un fallo ya publicado; se evita actualizándola | cve.org: cataloga «publicly disclosed cybersecurity vulnerabilities». A03:2025: vigilar CVE y actualizar | Correcta |
| Cuenta de fábrica: se cambia al instalar | A02:2025: «Default accounts and their passwords are still enabled and unchanged» | Correcta |
| Error detallado: el servidor muestra su código interno; se evita con un mensaje genérico | A02:2025: «Error handling reveals stack traces or other overly informative error messages to users». Siete cosas que revisar, sección 7 | Correcta |
| SQLi, XSS e inyección de órdenes son inyección | A05:2025 incluye CWE-89, CWE-79 y CWE-78 | Correcta |
| SQLi se evita con consultas parametrizadas | A05:2025: «a safe API… provides a parameterized interface» | Correcta |
| XSS: un comentario con código se ejecuta al leerlo; se evita escapando la salida | Ficha de OWASP sobre XSS: codificar la salida para que los datos no se interpreten como código. El comentario es un ejemplo | Correcta |
| Inyección de órdenes: se evita con funciones del lenguaje | Ficha de OWASP: «The primary defense is to avoid calling OS commands directly. Built-in library functions are a very good alternative» | Correcta |
| Fuerza bruta: prueba contraseñas comunes; se frena limitando los intentos | A07:2025: contraseñas débiles o conocidas, y «Limit or increasingly delay failed login attempts» | Correcta |
| «123456» fue la contraseña más común del mundo en 2025 | NordPass, informe 2025 (septiembre de 2024 a septiembre de 2025): primer puesto, seis de siete años | Correcta |
| La verificación en dos pasos frena la fuerza bruta | A07:2025: MFA «to prevent automated credential stuffing, brute force, and stolen credential reuse attacks» | Correcta |
| Suplantación: una passkey no funciona en la web falsa | passkeys.dev: los navegadores y sistemas garantizan que una passkey solo se usa en su servicio | Correcta |
| Robo de sesión: con la cookie se entra sin contraseña; `HttpOnly` la oculta a los scripts | MDN, cookies: robar el identificador de sesión hace parecer que se ha iniciado sesión como otro, y una cookie `HttpOnly` «can't be accessed by JavaScript» | Correcta |

Fuentes:
- [OWASP Top 10:2025](https://top10.owasp.org/2025/): [introducción](https://top10.owasp.org/2025/0x00_2025-Introduction/), [A01](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/), [A02](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/), [A03](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/), [A05](https://top10.owasp.org/2025/A05_2025-Injection/) y [A07](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/)
- Fichas de OWASP: [CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) e [inyección de órdenes](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html); [Path Traversal](https://community.owasp.org/attacks/Path_Traversal); [quiénes son](https://owasp.org/about/)
- [MDN, cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) y [passkeys.dev](https://passkeys.dev/docs/intro/what-are-passkeys/)
- [CVE](https://www.cve.org/About/Overview) y [NordPass, contraseñas más comunes](https://nordpass.com/most-common-passwords-list/)
