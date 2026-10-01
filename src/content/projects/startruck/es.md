---
slug: startruck
title: Star Track | Rastreo de viajes
tagline: El teléfono del chofer envía la posición del viaje hasta cerrarlo y le permite reportar emergencias en carretera.
areas: [movil]
kind: profesional
org: Star Cargo Service
role: Mantenimiento y corrección de errores
period:
  start: '2026-07'
  end: '2026-08'
tier: ficha
home: false
visibility: privado
repo: null
site: null
stack:
  - React Native (Expo)
  - TypeScript
  - SQLite
  - Node.js
  - MySQL
  - Render
cover: null
order: null
---

## Contexto

Star Track es la aplicación que lleva el chofer durante un viaje de carga. Escanea su credencial para identificarse y después la carta porte del viaje. Desde ese momento, el teléfono envía posiciones hasta que el viaje se cierra, sin que el chofer tenga que hacer nada. En carretera es también su herramienta para reportar una emergencia y localizar el hospital, la comisaría o la gasolinera más cercanos.

La aplicación la construyó otro desarrollador del equipo. Entré con ella ya en marcha, para corregir los defectos que aparecieron al probarla en un dispositivo real y al revisar el servicio en producción.

## Problema

La empresa necesita la posición de un viaje mientras ocurre, y el chofer necesita pedir ayuda desde la carretera sin buscar un número.

Por eso el registro tiene que salir del propio teléfono y funcionar sin intervención durante horas. Un viaje que deja de reportar sin que nadie lo note deja la carga sin seguimiento hasta que alguien pregunta por ella.

## Decisiones técnicas

Ninguno de los defectos se veía leyendo el código. Aparecieron al ejecutar la aplicación en un teléfono real y al seguir el comportamiento del servicio ya desplegado.

La cadencia de cinco minutos no existía: el teléfono guardaba un punto cada veintisiete segundos, diez veces las filas presupuestadas. Cuando el rastreo se detenía, rearmar el servicio no lo recuperaba. Además, la pantalla de viaje fallaba al cerrar la operación y dejaba al chofer ante una pantalla en blanco al terminar el viaje.

Android trata el intervalo de posición pedido como el deseado, no como un mínimo, y la petición se registraba sin un intervalo mínimo. Por eso ahora la cadencia la impone la aplicación. Acepta lo que entregue el sistema y descarta cualquier punto que llegue antes del ochenta por ciento del intervalo vigente.

Rearmar el servicio no basta, así que cada reintento del vigilante captura además un punto suelto. Los dos mecanismos de recuperación que ya existían están dentro del teléfono, y con el proceso terminado no se ejecuta ningún código de la aplicación. Por eso se añadió una comprobación en el servidor, la única que no depende de Android.

Ese aviso no habría saltado nunca. El controlador de MySQL devolvía las fechas en la zona horaria del proceso, mientras la base las guarda en UTC. La resta daba negativa, sin error y sin registro. Ahora el tiempo sin reportes se calcula en SQL contra la hora UTC del servidor.

## Arquitectura

El teléfono ejecuta un servicio en primer plano que recoge posiciones. Los puntos no se envían directamente. Entran en una bandeja local, y una tarea la sincroniza cada pocos segundos, con una espera creciente ante fallos y sin duplicar puntos ya enviados. Un túnel o una zona sin cobertura retrasan el envío, pero no se pierde ningún punto.

Sobre esa base hay tres mecanismos de recuperación, ordenados por cuánto dependen del teléfono:

1. Dos vigilantes dentro de la aplicación la reinician cuando Android termina su proceso.
2. Una notificación programada salta si el rastreo deja de capturar, y sigue activa aunque el proceso termine.
3. Una comprobación en el servidor avisa a Operaciones cuando un viaje activo lleva quince minutos sin reportar.

## Resultado

La cadencia pasó de un punto cada veintisiete segundos al intervalo configurado, con la reducción de filas que eso supone en la tabla de rastreo. La pantalla de viaje dejó de fallar al cerrar la operación.

Un viaje que deja de reportar ya no depende de que alguien lo note. El aviso sale del servidor, el único de los tres mecanismos que sigue funcionando con el teléfono apagado.

## Lo que aprendí

La documentación de Android describe el intervalo de posición como una solicitud, no como una garantía. En un dispositivo real, la diferencia fue de un punto cada veintisiete segundos frente a uno cada cinco minutos, y ninguna lectura del código lo habría mostrado.

Dos de los defectos no producían ningún fallo visible. El de la zona horaria no daba error ni dejaba registro, porque la condición nunca se cumplía. Solo aparecieron al probar contra el sistema real.
