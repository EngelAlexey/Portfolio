---
slug: startruck
title: Star Track | Rastreo de viajes
tagline: App Android para el chofer en ruta. Emergencias, servicios cercanos y la cadencia de posiciones que Android no garantiza.
areas: [movil]
kind: profesional
org: Star Cargo Service
role: Desarrollo
period:
  start: '2026-04'
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

El chofer escanea su credencial para identificarse y después la carta porte del viaje. Desde ese momento el teléfono envía posiciones hasta que el viaje se cierra, sin que él tenga que operar nada.

La app es además su herramienta en carretera: reporta una emergencia y localiza el hospital, la comisaría o la gasolinera más cercana sin salir de ella.

## Problema

El objetivo de partida fue la seguridad del chofer. Un viaje de carga cruza tramos donde una avería o un incidente deja a una persona sola, y la respuesta depende de saber dónde está.

Del mismo registro sale el segundo objetivo: la operación y el cliente conocen la posición de la carga en cualquier momento, sin llamar a nadie. Eso obliga a que el teléfono reporte por su cuenta durante horas, sin que nadie lo atienda.

## Decisiones técnicas

`timeInterval` no garantiza nada en Android. Al pedir una posición cada cinco minutos, el sistema entrega varias por segundo. Al pedir que no suspenda el servicio en primer plano, el fabricante lo mata igual por ahorro de batería. Los dos comportamientos se midieron en dispositivo real.

Así que la cadencia la impone la app. Acepta lo que el sistema entregue y descarta cualquier punto anterior al 80 % del intervalo vigente: cinco minutos en marcha normal, uno en seguimiento en vivo.

El nivel de batería no entra en la decisión. La función conserva el parámetro por compatibilidad de firma y lo ignora de forma deliberada. El requisito es que el punto salga cada cinco minutos con 20 % de carga y el modo de ahorro activo.

## Arquitectura

Dos vigilantes independientes reinician el servicio en primer plano cuando Android lo mata o deja de entregar posiciones. Cada reinicio captura además un punto suelto, porque rearmar el servicio no siempre restablece la entrega.

Los puntos no se envían directo. Entran en una bandeja de salida en SQLite. Un trabajador la sincroniza cada diez segundos, con espera creciente ante fallos e idempotencia por identificador de cliente. Un túnel o una zona sin cobertura retrasan el envío sin perder puntos.

## Resultado

No hay filtro por distancia ni detección de vehículo detenido. Un chofer parado tres horas en aduana sigue generando un punto cada cinco minutos.

Esos puntos repetidos son la única señal de que el rastreo sigue activo. Sin ellos, el backend no puede distinguir un vehículo detenido de un teléfono que dejó de reportar.

## Lo que aprendí

El documento de cadencia describió durante meses un filtro por distancia y un modo en vivo de diez segundos que el código ya no tenía. Se reemplazaron y nadie actualizó la página.

Ahora ese documento nombra los tres archivos que son su fuente de verdad y lleva arriba la corrección de lo que afirmaba antes.
