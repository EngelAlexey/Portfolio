# ¿Cómo funciona una página web?

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 16 piezas en cuatro pasos:
1. **Buscar el servidor:** URL, DNS, IP y TTL.
2. **Conectar:** TCP, 443, TLS y HTTPS.
3. **Pedir y responder:** GET, 200, HTML y cookie.
4. **Dibujar:** DOM, CSS, JS y F12.

## Portada

- **Color: magenta.** Ninguna portada publicada ni en cola usa ese color. Las publicadas son azul muy oscuro, naranja, violeta e índigo; las que esperan turno, verde bosque, verde azulado, carmín y azul petróleo.
- **Encuadre.** El contenido va de 168 a 912 px, dentro del recorte de la cuadrícula: `node ../comprueba.mjs`.

## Texto de la publicación

```
¿Cómo funciona una página web? 🌐⚡

Entre que escribes una dirección y ves la página, tu navegador busca el servidor, abre una conexión cifrada, pide el contenido y lo dibuja en pantalla. Todo eso pasa cada vez que abres un enlace.

En este carrusel te explico los 4 pasos y las 16 piezas que intervienen: DNS, TLS, HTTP, el DOM y más.

⚠️ Un detalle de seguridad: todo lo que descarga el navegador se puede leer con F12. Por eso una clave secreta nunca debe ir en el JavaScript de una página.

👉 ¡Desliza para ver cada paso!
🔗 Cómo termina una clave ahí, con código, en alexherrera.dev/es/blog/revisar-codigo-generado-por-ia (link en bio).

¿Qué paso te sorprendió más? ¡Te leo en los comentarios! 👇💬

#DesarrolloWeb #Programacion #HTTP #Ciberseguridad
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «Todo lo que descarga el navegador se puede leer».
- **Adhesivo de enlace.** Con el texto «Leer el artículo» y esta dirección, que apunta a la sección 4. No está comprobado que el navegador de Instagram baje hasta ella; como mínimo abre el artículo:
  `https://www.alexherrera.dev/es/blog/revisar-codigo-generado-por-ia?utm_source=instagram&utm_medium=story&utm_campaign=pagina-web#4-un-secreto-termina-en-el-paquete-que-descarga-el-navegador`
- **Después.** Guardar la historia en la destacada del artículo.

Todavía no hay un artículo sobre cómo funciona la web. El temario lo enlaza con «¿Tu router sabe qué buscas?», que está sin escribir. Mientras tanto, la historia lleva a la sección de «Siete cosas que revisar» que trata lo que descarga el navegador.

## Programación

Programado en Meta Business Suite para el viernes 18 de septiembre de 2026, 1:00 p. m., sugerida por Meta. La historia se sube a mano ese mismo día.

## Auditoría

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| Una URL tiene protocolo, dominio y ruta | RFC 3986 §3: *scheme*, *authority* y *path* | Correcta, simplificada (también hay consulta y fragmento) |
| `https://alexherrera.dev/es/blog` existe | La página responde 200 | Correcta |
| El DNS convierte el dominio en la IP del servidor | RFC 1034: los nombres sirven para obtener direcciones de equipos | Correcta |
| La IP identifica al servidor en la red | RFC 791 | Correcta |
| TTL: cuánto se guarda la respuesta antes de volver a preguntar | RFC 1035 §3.2.1: «may be cached before the source of the information should again be consulted» | Correcta |
| TCP une el navegador con el servidor; HTTP/3 usa QUIC sobre UDP | RFC 9110 §4.2.2 (https sobre conexiones TCP), RFC 9114 (HTTP sobre QUIC) y RFC 9000 («QUIC packets are carried in UDP datagrams») | Correcta |
| El 443 es el de HTTPS por defecto y el 80 el de HTTP | RFC 9110 §4.2.2 y §4.2.1 | Correcta |
| TLS cifra la conexión y comprueba que el servidor es quien dice ser | RFC 8446 §1: el servidor siempre se autentica, y los datos solo los ven los dos extremos | Correcta |
| HTTPS es HTTP con TLS, y lo que viaja va cifrado | RFC 9110 §4.2.2 y RFC 8446 §1 | Correcta. TLS no oculta la longitud de los datos |
| GET es el método con el que se pide la página | RFC 9110 §9.3.1: «requests transfer of a current selected representation» | Correcta |
| 200: todo salió bien y llega el contenido | RFC 9110 §15.3.1 | Correcta |
| Una cookie la pide guardar el servidor y el navegador la reenvía después | RFC 6265 §3: `Set-Cookie` en la respuesta, `Cookie` en las peticiones siguientes | Correcta |
| El navegador construye el DOM con el HTML, y JavaScript puede cambiarlo | MDN, «How browsers work»: el DOM representa el marcado y se puede manipular desde JavaScript | Correcta |
| HTML, CSS y JS: estructura, estilo e interactividad | Descripción general, sin cifras | Correcta |
| Lo que se descarga se puede leer, así que una clave secreta no va ahí | «Siete cosas que revisar», sección 4: las variables públicas se incrustan en el paquete que recibe el navegador (documentación de Next.js) | Correcta |

Fuentes:
- [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986)
- [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) y [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035)
- [RFC 791](https://www.rfc-editor.org/rfc/rfc791)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114) y [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000)
- [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
- [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265)
- [MDN, How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work)
