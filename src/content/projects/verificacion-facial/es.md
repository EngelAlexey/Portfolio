---
slug: verificacion-facial
title: Verificación facial | Marcaje de asistencia
tagline: Confirma que quien marca asistencia es la persona registrada, comparando la foto del momento con su rostro guardado.
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

[Seiri](/es/proyectos/seiri-asistencia) registra la asistencia del personal desde el teléfono. Para que ese registro sirva, hay que confirmar que quien marca es la persona a la que corresponde el marcaje y no un compañero con su teléfono.

Este servicio hace esa confirmación. Recibe la foto tomada en el momento y devuelve qué tan cerca está del rostro registrado de esa persona.

Cuando lo tomé, el servicio ya estaba en producción. Lo había creado otro desarrollador del equipo. Mi encargo fue rehacer su interior para que resistiera el uso diario y mantenerlo a partir de ahí.

## Problema

Todos los marcajes del día pasaban por el servicio, que repetía el trabajo completo en cada uno. Cada comparación significaba descargar las dos imágenes a archivos temporales y ejecutar una verificación completa entre ellas. El rostro de referencia se volvía a procesar en cada marcaje, todos los días, sin haber cambiado.

Además, cada petición abría su propia conexión a la base de datos, sin grupo de conexiones ni reintento. Un corte momentáneo dejaba el marcaje sin puntuación.

Los registros eran texto libre, sin identificador de petición ni tiempo transcurrido. Un marcaje rechazado no se podía seguir, porque no había forma de saber si había fallado la descarga, la detección o la comparación.

## Decisiones técnicas

La ficha de la persona ya guardaba su vector facial, pero la comparación no lo usaba. Ahora un marcaje obtiene el vector de la foto del momento y lo compara con el guardado, por similitud del coseno. El trabajo sobre la referencia se hace una vez y no en cada marcaje.

El modelo se construye una sola vez y queda en la memoria del servicio, protegido por un bloqueo para que dos peticiones simultáneas no lo construyan a la vez.

Las imágenes se reducen a un lado máximo antes de calcular el vector. El coste crece con el tamaño de la imagen, y los píxeles de más no mejoran el resultado.

Las conexiones salen de un grupo con reintentos acotados, para que un corte breve no se confunda con un rechazo.

Cada petición lleva un identificador propio y sus registros salen estructurados, con la etapa y el tiempo transcurrido. Un marcaje rechazado se puede seguir hasta el punto exacto donde falló.

## Arquitectura

El servicio recibe la imagen de dos formas, según su origen. Puede llegar por el identificador de un archivo en Drive, para las imágenes que ya estaban allí, o incrustada en la petición, que es el camino que usa Seiri.

Desde ahí, el recorrido es el mismo:

1. detección del rostro;
2. cálculo del vector;
3. comparación con el vector guardado de esa persona;
4. escritura de la puntuación en la fila del marcaje.

El vector de referencia se calcula al dar de alta a la persona, así que en el marcaje ya está guardado.

La instancia que carga el modelo se suspende y se reanuda por horario, con dos tareas programadas que llaman al API del alojamiento. Un servicio que mantiene un modelo en memoria cuesta lo mismo ocupado que inactivo.

## Resultado

El marcaje recibe su puntuación en el mismo intercambio. La referencia se calcula una vez por persona, y cada petición envía una sola imagen en lugar de dos.

Un rechazo dejó de ser un resultado opaco. Con el identificador de la petición se ve en qué etapa se detuvo y cuánto tardó cada una. Con ese dato se puede responder a un empleado que asegura haber marcado.

## Lo que aprendí

El coste de un servicio con modelo estaba en el trabajo repetido alrededor de la comparación. Descargar dos imágenes y volver a procesar una referencia que no cambiaba costaba más que el cálculo mismo.

Un dato derivado que no cambia se guarda. El rostro de referencia de una persona es uno de esos datos. Tratarlo como un archivo que había que volver a leer convertía un trabajo de una vez en un trabajo diario.
