# ¿Qué significan los códigos 200, 300, 400 y 500?

Carrusel solo de Instagram, preparado el 16 de septiembre de 2026 y rehecho ese mismo día con las notas de Alex: más códigos por familia, qué hace cada uno y un cierre que los resume todos. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 19 códigos:
- **2xx:** 200, 201, 202, 204 y 206.
- **3xx:** 301, 302, 304, 307 y 308.
- **4xx:** 400, 401, 403, 404 y 429.
- **5xx:** 500, 502, 503 y 504.

Quedan fuera el 405, el 409 y el 422, que son menos habituales para quien empieza.

## Portada

- **Color: verde bosque.** El 16 de septiembre, las cuatro portadas de la cuadrícula eran azul muy oscuro, naranja, violeta e índigo, y la primera versión de esta portada era índigo, igual que la de «¿Se aprende…?».
- **Encuadre.** Todo su contenido está entre los píxeles 168 y 912 (medido en Chrome, por los extremos de cada renglón), dentro de la franja de 135 a 945 que enseña la cuadrícula.
- **Vistas.** `vista-cuadricula.png` es la portada recortada como en el perfil. `vista-perfil.png` la monta delante de las cuatro publicadas, tomadas de la cuadrícula ese mismo día.

## Texto de la publicación

```
¿Qué significan los códigos HTTP 200, 300, 400 y 500? 🌐🔢

Cada vez que una web responde, envía un código de tres cifras. No hace falta memorizarlos: el primer dígito ya te dice qué pasó con tu petición.

En este carrusel te comparto 19 códigos, qué significa cada uno y una lámina final para guardarlos como referencia.

⚠️ Un detalle de seguridad: un 404 no siempre significa que algo no existe. El estándar de HTTP (RFC 9110) permite usarlo para no revelar que un recurso existe.

💡 Para verlos en tu navegador: F12 → pestaña Red → columna Estado.

👉 ¡Desliza para ver cada familia!
🔗 El caso del 404, con código, en alexherrera.dev/es/blog/revisar-codigo-generado-por-ia (link en bio).

¿Qué código te ha hecho sufrir más? ¡Te leo en los comentarios! 👇💬

#Programacion #DesarrolloWeb #HTTP #Ciberseguridad
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

«HTTP» va en la primera línea a propósito. «Código 200» solo, en una búsqueda en español, también devuelve resultados de operadoras y de códigos laborales.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿Por qué 404 y no 403?».
- **Adhesivo de enlace.** Con el texto «Leer el artículo» y esta dirección:
  `https://www.alexherrera.dev/es/blog/revisar-codigo-generado-por-ia?utm_source=instagram&utm_medium=story&utm_campaign=codigos-http`
- **Después.** Guardar la historia en la destacada del artículo.

`utm_campaign` lleva el nombre del carrusel, no el slug del artículo como decía el plan. Así, dos piezas que enlazan al mismo artículo se distinguen en GA4.

El temario enlaza esta historia al artículo de CORS. Mientras ese artículo no exista, se enlaza a «Siete cosas que revisar», cuya sección 2 explica por qué el endpoint responde 404 y no 403.

## Programación

Programado en Meta Business Suite para el jueves 17 de septiembre de 2026, 2:00 p. m. La eligió Alex entre las sugerencias de Meta. La historia se sube a mano ese mismo día.

## Auditoría

Salvo que se indique otra cosa, las secciones son del RFC 9110.

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| Cada respuesta lleva un código de tres cifras, y el primer dígito dice qué pasó | §15: «a three-digit integer code»; el primer dígito define la clase | Correcta |
| Van 19 códigos | 5 + 5 + 5 + 4 en las láminas 2 a 5, y los mismos 19 en el resumen | Correcta |
| Si empieza por 2, todo salió bien | §15.3: «successfully received, understood, and accepted» | Correcta |
| 200: funcionó y trae lo pedido | §15.3.1: «the request has succeeded»; con GET, el contenido es el recurso pedido | Correcta |
| 201: se creó algo nuevo, como una cuenta al registrarse | §15.3.2: «resulted in one or more new resources being created» | Correcta. El registro es un ejemplo |
| 202: se aceptó y se procesará después | §15.3.3: «accepted for processing, but the processing has not been completed», y de ejemplo «perhaps a batch-oriented process that is only run once per day» | Correcta |
| 204: funcionó y no hay nada que devolver, por ejemplo al borrar | §15.3.5 («no additional content to send») y §9.3.5 (un DELETE aplicado puede responder 204) | Correcta |
| 206: llega una parte del archivo, así se reanuda una descarga | §15.3.7 (respuesta a una petición de rango) y §14 (pedir el resto tras una transferencia interrumpida) | Correcta |
| Si empieza por 3, el servidor redirige | §15.4: la clase 3xx se llama *Redirection* | Correcta |
| 301: cambio permanente; los enlaces deberían apuntar a la nueva dirección | §15.4.2: «any future references to this resource ought to use one of the enclosed URIs» | Correcta |
| 302: temporal; la dirección de siempre sigue siendo la buena | §15.4.3: «the client ought to continue to use the target URI» | Correcta |
| 304: nada cambió y el navegador usa su copia | §15.4.5: el cliente «already has a valid representation» y el servidor lo remite a la copia guardada | Correcta, simplificada: la condición la pone la propia petición |
| 307: temporal sin cambiar el método; un POST sigue siendo POST | §15.4.8 («MUST NOT change the request method») y estándar Fetch (con 301 y 302, un POST pasa a GET) | Correcta |
| 308: permanente y tampoco cambia el método | §15.4.9 y la nota de §15.4.2, que propone el 308 para no cambiar el método | Correcta |
| Si empieza por 4, el fallo está en la petición | §15.5: «the client seems to have erred» | Correcta, simplificada |
| 400: petición mal formada, como un JSON con la sintaxis rota | §15.5.1 («malformed request syntax»). Express (body-parser) responde 400 a un cuerpo que no puede interpretar | Correcta |
| 401: pese al nombre, falta identificarse | §15.5.2: «lacks valid authentication credentials» | Correcta |
| 403: no tienes permiso; con la misma cuenta, reintentar no sirve | §15.5.4: «refuses to fulfill it» y «SHOULD NOT automatically repeat the request with the same credentials» | Correcta. El RFC admite también motivos ajenos a la cuenta |
| 404: no hay nada, o el servidor prefiere no revelar que existe | §15.5.5 («not willing to disclose that one exists») y §15.5.4 | Correcta |
| 429: demasiadas peticiones en poco tiempo; hay que esperar | RFC 6585 §4: «too many requests in a given amount of time», con `Retry-After` para indicar la espera | Correcta |
| Si empieza por 5, el fallo está en el servidor | §15.6: «the server is aware that it has erred» | Correcta |
| 500: algo inesperado impidió cumplir la petición | §15.6.1: «unexpected condition that prevented it from fulfilling the request» | Correcta |
| 502: un intermediario recibió una respuesta inválida | §15.6.3: «acting as a gateway or proxy, received an invalid response» | Correcta |
| 503: no puede atender ahora por sobrecarga o mantenimiento | §15.6.4: «temporary overload or scheduled maintenance… alleviated after some delay» | Correcta |
| 504: el intermediario no recibió respuesta a tiempo | §15.6.5: «did not receive a timely response from an upstream server» | Correcta |
| Etiquetas del resumen | Cada una resume la fila de su lámina, sin añadir nada | Correcta |
| RFC 9110 es el estándar de HTTP | Cabecera del RFC: «STD: 97», «Standards Track», junio de 2022 | Correcta |
| El artículo enlazado existe y se llama así | `draft: false`; la página responde 200 con ese `<title>` | Correcta |
| F12 → pestaña Red → columna Estado | Documentación de Chrome DevTools en español: «Haz clic en la pestaña Red» y «Estado: Es el código de respuesta HTTP» | Correcta. En Mac el atajo es Comando+Opción+I |

Fuentes:
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 6585, sección 4](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [Estándar Fetch, HTTP-redirect fetch](https://fetch.spec.whatwg.org/#http-redirect-fetch)
- [body-parser, «entity parse failed»](https://github.com/expressjs/body-parser#entity-parse-failed)
- [Chrome DevTools, actividad de red](https://developer.chrome.com/docs/devtools/network?hl=es)
