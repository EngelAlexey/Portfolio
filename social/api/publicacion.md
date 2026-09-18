# ¿Qué es una API?

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 20 términos, y el resumen los repite todos:
- **Piezas:** API, cliente, servidor, endpoint y JSON.
- **Métodos:** GET, POST, PUT, PATCH y DELETE.
- **Petición:** Params, Headers, Body, token y status.
- **Seguridad:** HTTPS, 401, 403, el id de otro usuario y 429.

Los códigos de estado solo se nombran: `codigos-http/` los explica todos, y el texto de la publicación remite a él. Params, Headers y Body van como los rotula Postman, que es donde los ve quien empieza.

## Portada

- **Color: ciruela.** Era el único tono de la paleta que no tenía portada en la cuadrícula. El más cercano de la cuadrícula es el violeta de «Por dónde se empieza…», que queda a tres filas.
- **Encuadre.** El título ocupa un renglón, y todo el contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.

## Texto de la publicación

```
¿Qué es una API y para qué sirve? 🔌💻

Una API es la forma en que un programa le pide datos o acciones a otro: una app del clima al servidor que tiene los datos, o una tienda al servicio de pagos. Cada petición dice qué quiere con un método, y la respuesta llega con un código de estado.

En este carrusel te comparto las piezas de una API, los cinco métodos, qué lleva una petición y qué comprueba el servidor en cada una.

⚠️ Un detalle de seguridad: si cambias el 42 de /pedidos/42 por 43, la API tiene que comprobar que ese pedido es tuyo. Ese fallo encabeza el OWASP API Security Top 10 de 2023.

💡 ¿Y los códigos 200, 404 o 500? Están en el carrusel de códigos HTTP del perfil.

👉 ¡Desliza y guarda la última lámina!
🔗 Por qué hay que comprobar el dueño de cada id, con código, en alexherrera.dev/es/blog/revisar-codigo-generado-por-ia (link en bio).

¿Qué API has usado en tus proyectos? ¡Te leo en los comentarios! 👇💬

#API #Programacion #DesarrolloWeb #Backend
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿Qué pasa si cambias el id de la URL?».
- **Adhesivo de enlace.** Con el texto «Leer el artículo» y esta dirección, que apunta a la sección 2:
  `https://www.alexherrera.dev/es/blog/revisar-codigo-generado-por-ia?utm_source=instagram&utm_medium=story&utm_campaign=api#2-el-recurso-se-carga-por-id-y-nadie-comprueba-de-qui%C3%A9n-es`
- **Después.** Guardar la historia en la destacada del artículo.

El temario enlaza este carrusel con «¿Qué es CORS y para qué sirve?», que está sin escribir. La sección 2 de «Siete cosas que revisar» explica la fila «id» de la lámina 5 con código.

## Programación

Programado en Meta Business Suite el 17 de septiembre de 2026 para el jueves 8 de octubre, 2:00 p. m., la hora que Meta sugería para los jueves. La historia se sube a mano ese mismo día.

## Auditoría

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| API: las reglas para que un programa use las funciones de otro | MDN, glosario: «a set of features and rules… enabling interaction with it through software» | Correcta |
| Cliente pide y servidor responde | RFC 9110 §3.3: el cliente envía la petición y el servidor la atiende con una respuesta | Correcta |
| Endpoint: cada URL que atiende peticiones | Uso habitual; OWASP API Security 2023 (API1) habla de los endpoints que reciben identificadores de objeto | Correcta |
| JSON: texto para intercambiar datos | MDN, glosario: «a data-interchange format» | Correcta |
| GET pide el recurso sin modificar nada | RFC 9110 §9.3.1 («retrieve a current representation») y §9.2.1 (GET es un método seguro) | Correcta |
| POST manda datos para que el servidor los procese; crear un registro es un ejemplo | RFC 9110 §9.3.3: procesamiento propio del recurso, con la creación de un recurso nuevo entre los ejemplos | Correcta |
| PUT sustituye el recurso entero | RFC 9110 §9.3.4 («replace all current representations») y RFC 5789 §1 | Correcta |
| PATCH cambia solo una parte, sin reenviar el recurso entero | RFC 5789 §1: PUT sobrescribe con un cuerpo completo y no sirve para cambios parciales | Correcta |
| DELETE elimina el recurso, y repetir la petición deja el mismo resultado | RFC 9110 §9.3.5 y §9.2.2: DELETE es idempotente | Correcta |
| Los parámetros van en la URL tras el signo `?` | RFC 3986 §3.4: la consulta empieza en el primer `?`. Postman: los parámetros de consulta van tras `?` | Correcta |
| `Content-Type` indica el formato | RFC 9110 §8.3: «indicates the media type of the associated representation» | Correcta |
| El cuerpo se envía con POST, PUT o PATCH, y un GET no suele llevar | Postman: «Typically you use body data with PUT, POST, and PATCH requests». RFC 9110 §9.3.1: el contenido de un GET no tiene semántica definida | Correcta |
| El token va en la cabecera `Authorization` | RFC 6750 §2.1: `Authorization: Bearer …`. RFC 9110 §11.6.2 | Correcta |
| La respuesta empieza con tres cifras: 200 si salió bien, 404 si no lo encuentra | RFC 9110 §15 («three-digit integer code»), §15.3.1 y §15.5.5 | Correcta, simplificada: el 404 también sirve para no revelar que algo existe |
| Params, Headers y Body son los nombres que usa Postman | Documentación de Postman: «Params tab», «Headers tab» y «Body tab» | Correcta |
| Sin HTTPS, el token viaja legible y quien lo copia puede usarlo | RFC 6750 §1.2 (cualquiera que lo tenga puede usarlo) y §5.2 (TLS obligatorio contra la revelación del token) | Correcta |
| 401: falta el token o no es válido, así que la petición no se aplica | RFC 9110 §15.5.2: «has not been applied because it lacks valid authentication credentials» | Correcta |
| 403: hay token, pero ese usuario no tiene permiso | RFC 9110 §15.5.4: el servidor entiende la petición y se niega, y no debe repetirse con las mismas credenciales | Correcta, simplificada |
| Cambiar el id no debe dar el objeto de otra persona, y ese fallo encabeza el OWASP API Security Top 10 2023 | API1:2023 Broken Object Level Authorization: validar la autorización al usar identificadores que envía el usuario | Correcta |
| 429: se superó el límite de peticiones; frena abusos y fuerza bruta | RFC 6585 §4 («too many requests in a given amount of time»). OWASP A07:2025: limitar los intentos fallidos | Correcta |

Fuentes:
- [MDN, API](https://developer.mozilla.org/en-US/docs/Glossary/API) y [JSON](https://developer.mozilla.org/en-US/docs/Glossary/JSON)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), [RFC 5789](https://www.rfc-editor.org/rfc/rfc5789.html), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html) y [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585.html)
- [OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10) y [OWASP A07:2025](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/)
- Postman: [parámetros y cuerpo](https://learning.postman.com/docs/sending-requests/create-requests/parameters/) y [cabeceras](https://learning.postman.com/docs/sending-requests/create-requests/headers/)
