---
slug: rastreo-buses
title: Rastreo de autobuses | Un API, tres roles
tagline: Un mismo API para pasajero, conductor y administración, migrando de capas técnicas a módulos por funcionalidad.
areas: [movil, fullstack]
kind: academico
org: Universidad Técnica Nacional
role: API y backend
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

Proyecto Integrador III, en equipo de seis. Fui el mayor contribuyente del API; el cliente móvil y el panel web los llevaron sobre todo otros compañeros.

El sistema sigue autobuses en vivo y atiende a tres papeles: pasajero, conductor y administración.

## Problema

El curso pedía seguimiento en vivo de una flota de autobuses para tres papeles: el pasajero que espera, el conductor al volante y la administración que supervisa.

Cada uno necesita un dato distinto del mismo viaje. El pasajero quiere saber cuándo llega su unidad; la administración, dónde está toda la flota a la vez.

## Decisiones técnicas

El proyecto arrancó con la estratificación clásica —rutas, controladores, servicios y repositorios— y creció hasta que localizar una funcionalidad exigía abrir cinco carpetas. Reescribirlo entero no era opción con el curso en marcha y cinco personas más sobre el mismo repositorio.

La migración fue progresiva y explícita. Cada funcionalidad nueva vive en su propio módulo, con su contrato, su implementación, su servicio y su enrutador juntos.

Las capas antiguas se quedaron como adaptadores delgados hacia esos módulos. Las dos formas conviven a propósito, y el repositorio documenta cuál de las dos recibe el código nuevo.

## Arquitectura

La telemetría del conductor se emite por canales de difusión y llega al pasajero que sigue esa unidad. Las alertas de proximidad usan canales temporales por usuario, que se suscriben, se usan y se cierran.

El estado del viaje no lo introduce nadie a mano: se deriva de la posición en vivo contra las paradas de la ruta.

## Resultado

El API sirve los tres papeles desde el mismo modelo de datos: el pasajero sigue su unidad, el conductor emite su posición y la administración ve la flota completa.

Dos guardias automáticos protegen el repositorio. Una regla propia del analizador estático rechaza comentarios en el código. Una verificación falla si alguna variable de entorno usada en el código no está declarada en el archivo de ejemplo, que es el fallo que solo aparece cuando alguien clona el repositorio por primera vez.

## Lo que aprendí

Anunciar la arquitectura nueva no bastó y siguió entrando código en las carpetas antiguas. Lo que sí funcionó fue dejar la forma antigua operativa como adaptador y escribir en el repositorio cuál de las dos recibe el código nuevo.
