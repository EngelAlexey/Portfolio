---
slug: startruck
title: Star Track | Rastreo de viajes
tagline: El chofer escanea la carta porte y el teléfono envía posiciones hasta cerrar el viaje. También reporta emergencias y localiza servicios en carretera.
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

Star Track es la aplicación que lleva el chofer durante un viaje de carga. Escanea su credencial para identificarse y después la carta porte del viaje. Desde ese momento el teléfono envía posiciones hasta que el viaje se cierra, sin que él tenga que operar nada. En carretera es además su herramienta para reportar una emergencia y localizar el hospital, la comisaría o la gasolinera más cercana.

La aplicación la construyó otro desarrollador del equipo. Entré con ella ya en marcha, para corregir los defectos que aparecieron al probarla en dispositivo real y al revisar el servicio en producción.

## Problema

Ninguno de los defectos se veía leyendo el código. Aparecieron corriendo la aplicación en un teléfono real y siguiendo el comportamiento del servicio ya desplegado.

La cadencia de cinco minutos no existía: el teléfono guardaba un punto cada veintisiete segundos, diez veces las filas presupuestadas. Y cuando el rastreo se detenía, rearmar el servicio no lo recuperaba.

El otro estaba fuera del rastreo: la pantalla de viaje reventaba al cerrar la operación, y el chofer se quedaba mirando una pantalla en blanco justo al terminar el viaje.

## Decisiones técnicas

El intervalo de posición que se le pide a Android es el deseado, no un mínimo, y la petición quedaba registrada sin piso. Así que la cadencia la impone ahora la aplicación: acepta lo que el sistema entregue y descarta cualquier punto anterior al ochenta por ciento del intervalo vigente.

Rearmar el servicio no basta, así que cada reintento del vigilante captura además un punto suelto. Y como las dos redes de recuperación existentes viven dentro del teléfono, donde con el proceso muerto no corre nuestro código, se añadió una comprobación en el servidor: es la única que no depende de Android.

Ese aviso no se habría disparado nunca. El controlador de MySQL devolvía las fechas en la zona del proceso mientras la base las guarda en UTC, de modo que la resta daba negativo, sin error y sin registro. El silencio se calcula ahora en SQL contra la hora UTC del servidor.

## Arquitectura

El teléfono ejecuta un servicio en primer plano que recoge posiciones. Los puntos no salen directo: entran en una bandeja local y un trabajador la sincroniza cada pocos segundos, con espera creciente ante fallos y sin duplicar un punto ya enviado. Un túnel o una zona sin cobertura retrasan el envío sin perder puntos.

Sobre esa base hay tres redes de recuperación, en orden de dependencia del aparato: dos vigilantes dentro de la aplicación que la reinician cuando Android la mata, una notificación programada que salta si el rastreo deja de capturar y sobrevive a la muerte del proceso, y una comprobación en el servidor que avisa a Operaciones cuando un viaje activo lleva quince minutos sin reportar.

## Resultado

La cadencia pasó de un punto cada veintisiete segundos al intervalo configurado, con la reducción de filas que eso implica en la tabla de rastreo. La pantalla de viaje dejó de reventar al cerrar la operación.

Un viaje que deja de reportar ya no depende de que alguien lo note. El aviso sale del servidor, que es la única de las tres capas que sigue funcionando con el teléfono apagado.

## Lo que aprendí

La documentación de Android describe el intervalo de posición como una solicitud, no como una garantía. En dispositivo real la diferencia fue de un punto cada veintisiete segundos frente a uno cada cinco minutos, y ninguna lectura del código lo habría mostrado.

Los dos defectos más caros no fallaban de forma visible. El de la zona horaria no producía error ni registro: la condición simplemente no se cumplía nunca. Probar contra el sistema real fue lo que los sacó a la luz.
