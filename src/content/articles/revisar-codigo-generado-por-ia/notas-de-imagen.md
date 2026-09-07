# Notas de imagen

Material de trabajo para el carrusel y las capturas del artículo. No se publica: el loader de la colección solo lee `es.mdx` y `en.mdx`.

## Capturas para el artículo

Una por punto, todas del proyecto de demostración y ninguna de un sistema real.

| Punto | Qué capturar |
|---|---|
| 1 | La terminal con el `curl -X DELETE` devolviendo `200 OK` y, al lado, la interfaz sin el botón. El contraste es la imagen. |
| 2 | Dos ventanas del navegador, sesión de empresa A y de empresa B, mostrando la misma factura. |
| 3 | La respuesta con la tabla completa tras enviar `x' OR '1'='1`, con el contador de filas visible. |
| 4 | Las herramientas del navegador, pestaña Sources, con la búsqueda de `sk_live` encontrando el valor en el paquete. |
| 5 | El `curl` con `cantidad: -3` devolviendo `200` y la fila del pedido con total negativo en la base de datos. |
| 6 | La salida de `npm view` con el `404`, y otra con una fecha de creación de hace tres días. |
| 7 | El cuerpo de la respuesta `500` con el nombre de la tabla y la traza visibles. |

Todas en tema oscuro, para que empaten con las portadas.

## Láminas del carrusel

Ocho láminas: portada más siete puntos. El carrusel entrega la lista completa y utilizable. El artículo aporta el código, la captura y la comprobación, que es lo que no cabe en una imagen.

1. **Portada.** Titular: «Siete cosas que revisar en el código que genera tu IA». Fondo `#17171c`, acento en el rojo del área de seguridad.
2. El permiso se comprueba en la interfaz.
3. El recurso se carga por id y nadie comprueba de quién es.
4. La consulta se arma concatenando.
5. Un secreto termina en el paquete que descarga el navegador.
6. La validación existe en el formulario y no en el endpoint.
7. Las dependencias citan paquetes que no existen.
8. El error devuelve el detalle interno al cliente.

Cada lámina lleva el enunciado del punto y una línea de qué hace el fallo. Sin código: el código es la razón para abrir el artículo.

La lámina de cierre lleva la dirección del artículo y nada más.
