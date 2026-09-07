---
slug: rastreo-buses
title: Rastreo de autobuses | Transporte público
tagline: El pasajero sigue el autobús en vivo, el conductor reporta y la administración supervisa, los tres sobre el mismo API.
areas: [movil, fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Desarrollo backend
period:
  start: '2026-05'
  end: '2026-07'
tier: ficha
home: false
visibility: publico
repo: https://github.com/utn-integrador-III/2026-bus-tracking-api
site: null
stack:
  - TypeScript
  - JavaScript
  - Express
  - Supabase
  - PostgreSQL
  - Expo
  - Next.js
  - Jest
cover: null
order: null
---

## Contexto

Proyecto Integrador III, en equipo de seis. El sistema sigue autobuses en vivo y atiende a tres roles: el pasajero que espera, el conductor al volante y la administración que supervisa la flota.

Aporté la mayor parte del API. El cliente móvil y el panel web los llevaron sobre todo otros compañeros.

## Problema

El pasajero de transporte público no sabe cuándo llega su unidad. Espera en la parada sin información, y la única alternativa es un horario publicado que el tráfico desmiente cada día.

Del otro lado, la administración no sabe dónde está su flota mientras opera. Se entera de un retraso cuando alguien lo reporta.

Los tres roles necesitan un dato distinto del mismo viaje, y ninguno lo tenía: el pasajero quiere saber cuándo llega su unidad, el conductor quiere reportar sin distraerse, la administración quiere ver la flota completa a la vez.

## Decisiones técnicas

El proyecto arrancó con la arquitectura por capas clásica, con rutas, controladores, servicios y repositorios, y creció hasta que localizar una funcionalidad exigía abrir cinco carpetas. Reescribirlo entero no era opción con el curso en marcha y cinco personas más sobre el mismo repositorio.

La migración fue progresiva y explícita. Cada funcionalidad nueva vive en su propio módulo, con su contrato, su implementación, su servicio y su enrutador juntos.

Las capas antiguas se quedaron como adaptadores delgados hacia esos módulos. Las dos formas conviven a propósito, y el repositorio documenta cuál de las dos recibe el código nuevo.

## Arquitectura

La telemetría del conductor se emite por canales de difusión y llega al pasajero que sigue esa unidad. Las alertas de proximidad usan canales temporales por usuario, que se suscriben, se usan y se cierran.

El estado del viaje no lo introduce nadie a mano: se deriva de la posición en vivo contra las paradas de la ruta, así que no depende de que el conductor recuerde marcarlo.

## Resultado

El API sirve los tres roles desde el mismo modelo de datos. El pasajero sigue su unidad, el conductor emite su posición sin operar nada y la administración ve la flota completa.

Dos comprobaciones automáticas protegen el repositorio. Una regla propia del analizador estático rechaza comentarios en el código. Una verificación falla si alguna variable de entorno usada en el código no está declarada en el archivo de ejemplo. Ese es el fallo que solo aparece cuando alguien clona el repositorio por primera vez.

## Lo que aprendí

Anunciar la arquitectura nueva no bastó y siguió entrando código en las carpetas antiguas.

Lo que sí funcionó fue dejar la forma antigua operativa como adaptador y escribir en el repositorio cuál de las dos recibe el código nuevo. En un equipo, un cambio de convención se sostiene con una regla escrita donde se trabaja, no con un acuerdo verbal.
