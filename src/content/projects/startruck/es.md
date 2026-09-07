---
slug: startruck
title: Star Track | Rastreo de viajes
tagline: El chofer escanea la carta porte y el teléfono envía posiciones hasta cerrar el viaje. También reporta emergencias y localiza servicios en carretera.
areas: [movil]
kind: profesional
org: Star Cargo Service
role: Desarrollo móvil
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
  - Vercel
cover: null
order: null
---

## Contexto

Star Track es la aplicación que lleva el chofer durante un viaje de carga. Escanea su credencial para identificarse y después la carta porte del viaje. Desde ese momento el teléfono envía posiciones hasta que el viaje se cierra, sin que él tenga que operar nada.

La aplicación es además su herramienta en carretera: reporta una emergencia y localiza el hospital, la comisaría o la gasolinera más cercana sin salir de ella.

Entré con la aplicación ya en marcha, a cargo del rastreo en segundo plano.

## Problema

El motivo de partida fue la seguridad del chofer. Un viaje de carga cruza tramos donde una avería o un incidente deja a una persona sola, y la respuesta depende de saber dónde está. Sin rastreo, esa información llega cuando el chofer consigue comunicarla.

Del mismo registro sale el segundo motivo. La operación y el cliente necesitan la posición de la carga mientras el viaje ocurre, y sin ella cada consulta termina en una llamada al chofer, que está conduciendo.

## Decisiones técnicas

Android no garantiza la cadencia que se le pide. Al solicitar una posición cada cinco minutos, el sistema entrega varias por segundo. Al pedir que no suspenda el servicio en primer plano, el fabricante lo mata igual por ahorro de batería. Los dos comportamientos se midieron en dispositivo real antes de escribir la solución.

Así que la cadencia la impone la aplicación. Acepta lo que el sistema entregue y descarta cualquier punto anterior al 80 % del intervalo vigente: cinco minutos en marcha normal, uno en seguimiento en vivo.

El nivel de batería no entra en la decisión. El requisito del negocio es que el punto salga cada cinco minutos con 20 % de carga y el modo de ahorro activo. Un viaje sin reportes es exactamente el caso en el que hace falta saber dónde está el vehículo.

## Arquitectura

Dos supervisores independientes reinician el servicio en primer plano cuando Android lo mata o deja de entregar posiciones. Cada reinicio captura además un punto suelto, porque rearmar el servicio no siempre restablece la entrega.

Los puntos no se envían directo. Entran en una bandeja de salida local, y un trabajador la sincroniza cada diez segundos, con espera creciente ante fallos y sin duplicar un punto ya enviado. Un túnel o una zona sin cobertura retrasan el envío sin perder puntos.

## Resultado

El teléfono sostiene la cadencia durante un viaje entero sin que el chofer intervenga. La operación y el cliente ven dónde está la carga sin llamar a nadie.

La aplicación reporta también con el vehículo detenido: un chofer parado tres horas en aduana sigue generando un punto cada cinco minutos. Es deliberado, porque esos puntos repetidos son lo que distingue un vehículo detenido de un teléfono que dejó de reportar.

## Lo que aprendí

La documentación de Android describe el intervalo de posición como una solicitud, no como una garantía. En dispositivo real la diferencia fue de varias posiciones por segundo frente a una cada cinco minutos.

Medir ese comportamiento en el aparato antes de diseñar la solución ahorró el trabajo de construir sobre una promesa que el sistema no cumple. Con un requisito operativo de por medio, la medición en el dispositivo concreto vale más que la especificación.
