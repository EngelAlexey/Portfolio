---
slug: verificacion-facial
title: Verificación facial | Marcaje de asistencia
tagline: Servicio que confirma que quien marca asistencia es la persona registrada. Compara la foto del momento contra el vector facial guardado, no contra otra foto.
areas: [ia, seguridad]
kind: profesional
org: Kaizen Apps CR
role: Rediseño del servicio y mantenimiento
period:
  start: '2025-11'
  end: '2026-05'
tier: ficha
home: false
visibility: privado
repo: null
site: null
stack:
  - Python
  - Flask
  - DeepFace
  - OpenCV
  - MySQL
  - Docker
  - Render
cover: null
order: null
---

## Contexto

Seiri registra la asistencia del personal desde el teléfono. Para que ese registro sirva de algo hay que confirmar que quien marca es la persona a la que corresponde el marcaje, y no un compañero con el teléfono en la mano.

Este servicio resuelve esa confirmación: recibe la foto tomada en el momento y devuelve qué tan cerca está del rostro registrado de esa persona.

El servicio ya existía y ya estaba en producción cuando lo tomé, levantado por otro desarrollador del equipo. Mi encargo fue rehacer su interior para que aguantara el uso diario y darle mantenimiento a partir de ahí.

## Problema

Cada marcaje del día pasaba por el servicio, y el servicio repetía en cada uno el trabajo entero. Comparar dos personas significaba descargar ambas imágenes a archivos temporales y ejecutar una verificación completa entre ellas. El rostro de referencia se volvía a procesar en cada marcaje, todos los días, sin haber cambiado.

Cada petición abría además su propia conexión a la base de datos, sin grupo ni reintento. Un corte momentáneo dejaba el marcaje sin puntuación.

Y los registros eran texto libre. Sin identificador de petición ni tiempo transcurrido, un marcaje rechazado no se podía seguir: no había forma de saber si se había caído la descarga, la detección o la comparación.

## Decisiones técnicas

La ficha de la persona ya guardaba su vector facial, pero la comparación no lo usaba. Un marcaje dejó de comparar dos imágenes: ahora obtiene el vector de la foto del momento y lo contrasta contra el que ya está guardado, por similitud del coseno. El trabajo sobre la referencia se hace una vez y no en cada marcaje.

El modelo se construye una sola vez y queda en memoria del servicio, protegido por un candado para que dos peticiones simultáneas no lo construyan a la vez.

Las imágenes se reducen a un lado máximo antes de calcular el vector. El coste crece con el tamaño de la imagen y los píxeles de más no mejoran el resultado.

Las conexiones salen de un grupo con reintentos acotados, para que un corte breve no se confunda con un rechazo.

Cada petición lleva un identificador propio y sus registros salen estructurados, con la etapa y el tiempo transcurrido. Un marcaje rechazado se puede seguir hasta el punto exacto donde se cayó.

## Arquitectura

El servicio recibe la imagen de dos formas, según de dónde venga: por identificador de un archivo en Drive, para lo que ya vivía allí, o incrustada en la petición, que es el camino que usa Seiri.

De ahí en adelante el camino es el mismo: detección del rostro, cálculo del vector, comparación contra el vector guardado de esa persona y escritura de la puntuación en la fila del marcaje. El vector de referencia se calcula al dar de alta a la persona, así que en el marcaje ya está guardado.

La instancia que sostiene el modelo se suspende y se reanuda por horario, llamando al API del alojamiento desde dos tareas programadas. Un servicio que carga un modelo en memoria cuesta lo mismo ocupado que ocioso.

## Resultado

El marcaje devuelve su puntuación en el mismo intercambio. La referencia se calcula una vez por persona en lugar de procesarse otra vez en cada marcaje, y una sola imagen viaja por petición en lugar de dos.

Un rechazo dejó de ser un resultado opaco. Con el identificador de la petición se ve en qué etapa se detuvo y cuánto tardó cada una, que es lo que permite responder a un empleado que asegura haber marcado.

## Lo que aprendí

El coste de un servicio con modelo no está en la comparación, está en todo lo que se repite alrededor de ella. Descargar dos imágenes y volver a procesar una referencia que no cambió pesaban más que el cálculo en sí.

La lección de fondo es que un dato derivado que no cambia se guarda. El rostro de referencia de una persona es exactamente eso, y tratarlo como un archivo que hay que volver a leer convertía un trabajo de una vez en un trabajo diario.
