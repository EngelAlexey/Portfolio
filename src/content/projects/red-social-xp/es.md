---
slug: red-social-xp
title: Red social estudiantil | Proyecto con XP
tagline: "El producto es pequeño a propósito para practicar el método: programación en parejas, entregas cortas y pruebas continuas."
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

Es un proyecto del curso Metodologías Ágiles de Desarrollo de Software. El ejercicio evalúa el método de trabajo más que el producto.

El profesor entrega un paquete de historias de usuario sobre una red social mínima, simple a propósito: publicar, comentar y reaccionar, todo sobre LocalStorage. El equipo la construye aplicando Programación Extrema.

El proyecto ocupó las últimas cuatro semanas del curso, desde la asignación de parejas hasta la demostración final ante la clase. Trabajé cuatro historias del backlog, con el registro y las pruebas que exige cada una.

## Problema

Un equipo sin método definido integra su trabajo al final, descubre los conflictos cuando ya no queda tiempo y no sabe decir qué está terminado.

El ejercicio está diseñado para evitarlo. Pone el proceso por encima del código y mantiene el producto tan simple que esas fallas no se pueden atribuir a la complejidad técnica.

Las reglas del método son la restricción real:

- cada pareja trabaja una sola historia a la vez;
- el conductor y el navegador rotan cada veinticinco minutos;
- un tablero muestra las columnas Pendiente, En desarrollo, En prueba y Terminado;
- las pruebas se registran antes de pedir revisión;
- después de cada historia aceptada se guarda una versión funcional;
- una historia que casi funciona sigue En desarrollo, porque la definición de Terminado es estricta.

## Decisiones técnicas

Cada historia se trabajó en su propia rama y entró por solicitud de incorporación, fusionada por otro integrante. Así el trabajo a medias se ve. Una rama abierta demasiado tiempo es una historia que no avanza, y el tablero lo muestra antes de que alguien pregunte.

La refactorización es continua, no una tarea aparte. Cada sesión termina con una versión estable, no con una rama a medio camino.

En el código, la decisión que condicionó al resto fue de compatibilidad. Las publicaciones ya guardadas en el navegador traían un contador de Me gusta del que dependen dos historias entregadas antes. Por eso el modelo nuevo de tres reacciones migra los datos al leerlos y mantiene sincronizado el contador antiguo. Ninguna de esas dos historias tuvo que cambiar, así que se cumplió la regla de no romper lo anterior sin detener a quien las escribió.

## Arquitectura

Son tres archivos de JavaScript sin dependencias: el punto de entrada, el módulo que dibuja las publicaciones y el módulo de almacenamiento, el único que toca LocalStorage. Toda lectura pasa por una normalización, y por eso una publicación guardada por una versión anterior se sigue abriendo.

La simplicidad es intencional. Sin dependencias ni compilación, cualquiera del equipo abre el proyecto y lo prueba en el navegador en el momento. Sin eso, las parejas no podrían rotar cada veinticinco minutos.

## Resultado

El sistema cerró con las veinte historias del paquete integradas y demostradas ante la clase. Las cuatro que trabajé quedaron aceptadas con sus criterios verificados, y la regresión sobre las anteriores pasó sin fallos.

El registro es el entregable principal. Cada historia queda con su evidencia, su prueba y los errores que aparecieron, así que se puede revisar el proceso además del producto.

## Lo que aprendí

Aprendí Programación Extrema aplicándola: programación en parejas con rotación, entregas cortas, refactorización continua e integración frecuente.

La práctica muestra dónde cuesta el método. La definición de Terminado resulta incómoda en el momento, pero evita cerrar una sesión con cuatro historias a medias en lugar de dos completas.
