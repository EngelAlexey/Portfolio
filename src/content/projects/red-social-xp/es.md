---
slug: red-social-xp
title: Red social estudiantil | Proyecto con XP
tagline: "Proyecto bajo Programación Extrema. El producto es pequeño a propósito: lo que se practica es el proceso, con parejas, entregas cortas y pruebas continuas."
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Desarrollo en equipo
period:
  start: '2026-08'
  end: '2026-08'
tier: ficha
home: false
visibility: publico
repo: https://github.com/Sacariel76/socialMediaProject
site: null
stack:
  - JavaScript
  - HTML
  - CSS
  - LocalStorage
cover: null
shots:
  - src: /img/shots/xp-muro.jpg
    alt: "Muro de la red social con el resumen de actividad, el formulario de publicación y las publicaciones con reacciones y comentarios"
    caption: "El muro con el respaldo de demostración cargado: resumen, filtros por etiqueta y paginación."
  - src: /img/shots/xp-moderacion.jpg
    alt: "El mismo muro con el filtro de moderación activo, que aísla las publicaciones reportadas"
    caption: "H20. El filtro de moderación aísla lo reportado sin ocultarlo del muro."
order: null
---

## Contexto

Curso de Metodologías Ágiles de Desarrollo de Software. El objeto del ejercicio no es el producto sino el método: el profesor entrega un paquete de historias de usuario sobre una mini red social deliberadamente simple —publicar, comentar, reaccionar, todo sobre LocalStorage— y el equipo la construye aplicando Programación Extrema.

El proyecto ocupó las últimas cuatro semanas del curso, de la asignación de parejas a la demostración final ante la clase. Trabajé cuatro historias del backlog, con el registro y las pruebas que cada una exige.

## Problema

Un equipo sin método definido integra al final, descubre los conflictos cuando ya no queda tiempo y no sabe decir qué está terminado. El ejercicio está construido para que eso no ocurra: impone el proceso por encima del código y deja el producto lo bastante simple como para que ninguna de esas fallas pueda esconderse detrás de la complejidad técnica.

Las reglas son la restricción real. Una historia a la vez por pareja. Conductor y navegador rotando cada veinticinco minutos. Un tablero con Pendiente, En desarrollo, En prueba y Terminado. Pruebas registradas antes de pedir revisión, y una versión funcional guardada después de cada historia aceptada. Y una definición de Terminado que no admite matices: si casi funciona, sigue En desarrollo.

## Decisiones técnicas

Cada historia se trabajó en su propia rama y entró por solicitud de incorporación, fusionada por otro integrante. Eso hace visible el trabajo a medias: una rama abierta demasiado tiempo es una historia que no avanza, y el tablero lo refleja antes de que alguien lo pregunte.

Las pruebas se registran antes de pedir revisión, no después de fusionar, y la refactorización es continua en lugar de una tarea aparte. Cada sesión cierra con una versión estable, no con una rama a medio camino.

Del código, la decisión que condicionó al resto fue de compatibilidad. Las publicaciones ya guardadas en el navegador traían un contador de Me gusta del que dependen dos historias entregadas antes, así que el modelo nuevo de tres reacciones migra al leer y mantiene el contador viejo sincronizado. Ninguna de esas dos historias tuvo que tocarse, que es la única forma de cumplir la regla de no romper lo anterior sin detener a quien la escribió.

## Arquitectura

Tres archivos de JavaScript sin dependencias: el punto de entrada, el módulo que dibuja las publicaciones y el módulo de almacenamiento, único que toca LocalStorage. Toda lectura pasa por una normalización, que es lo que permite que una publicación guardada por una versión anterior siga abriendo.

La simplicidad es intencional. Sin dependencias ni compilación, cualquiera del equipo abre el proyecto y lo prueba en el navegador en el momento, que es la condición para que las parejas puedan rotar cada veinticinco minutos.

## Resultado

El sistema cerró con las veinte historias del paquete integradas y demostradas ante la clase. Las cuatro que trabajé quedaron aceptadas con sus criterios verificados, y la regresión sobre las anteriores pasó sin fallos.

El entregable real es el registro. Cada historia queda con su evidencia, su prueba y los errores que aparecieron por el camino, que es lo que permite revisar el proceso y no solo el producto.

## Lo que aprendí

Aprendí a usar Programación Extrema aplicándola y no leyéndola: programación en parejas con rotación, entregas cortas, refactorización continua e integración frecuente, con las pruebas registradas antes de pedir revisión.

Practicarla es lo que muestra dónde aprieta el método. La definición de Terminado resulta incómoda en el momento y es justo lo que evita cerrar una sesión con cuatro historias a medias en lugar de dos completas.
