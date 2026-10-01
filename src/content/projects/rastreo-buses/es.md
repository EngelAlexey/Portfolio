---
slug: rastreo-buses
title: Rastreo de autobuses | Transporte público
tagline: El pasajero sigue el autobús en vivo, el conductor reporta y la administración supervisa la flota desde el mismo sistema.
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
  - OpenAPI
cover: null
shots:
  - src: /img/shots/bus-api-docs.jpg
    alt: "Swagger UI de la API de rastreo, con los módulos del sistema listados: autenticación, incidentes, rutas, viajes, conductores y telemetría"
    caption: "El contrato de la API en Swagger. Cada módulo del sistema es un grupo de rutas documentado."
  - src: /img/shots/bus-api-incidente.jpg
    alt: "Detalle de una ruta en Swagger: el reporte de incidentes, con el cuerpo de la solicitud y las respuestas 201 y 400 con sus ejemplos"
    caption: "Una ruta por dentro: el reporte de incidentes, con su solicitud y las respuestas de éxito y de validación."
  - src: /img/shots/bus-app-pasajero.jpg
    alt: "App móvil del pasajero: pantalla de inicio con viajes disponibles San José–Alajuela y San José–Puntarenas, marcados en ruta y en vivo"
    caption: "La app del pasajero (cliente móvil del equipo) sobre la API: los viajes en vivo con su estado en ruta."
  - src: /img/shots/bus-login-admin.jpg
    alt: "Pantalla de acceso de la consola de administración, con el panel de marca y el formulario de inicio de sesión restringido a administradores"
    caption: "La consola de administración, la entrada al panel que consume la misma API."
order: null
---

## Contexto

Es el Proyecto Integrador III, hecho en un equipo de cinco. El sistema sigue autobuses en vivo y atiende a tres roles: el pasajero que espera, el conductor al volante y la administración que supervisa la flota.

Aporté la mayor parte de la API y diseñé la interfaz del cliente móvil y del panel web. Mis compañeros los construyeron sobre ese diseño y lo fueron modificando.

## Problema

El pasajero de transporte público no sabe cuándo llega su unidad. Espera en la parada sin información, y la única alternativa es un horario publicado que el tráfico altera cada día.

La administración tampoco sabe dónde está su flota mientras opera. Se entera de un retraso cuando alguien lo reporta.

Los tres roles necesitan un dato distinto del mismo viaje, y ninguno lo tenía:

- el pasajero, saber cuándo llega su unidad;
- el conductor, reportar sin distraerse;
- la administración, ver la flota completa a la vez.

## Decisiones técnicas

El proyecto empezó con la arquitectura clásica por capas: rutas, controladores, servicios y repositorios. Creció hasta que localizar una funcionalidad exigía abrir cinco carpetas. Reescribirlo entero no era una opción con el curso en marcha y cinco personas más trabajando sobre el mismo repositorio.

La migración fue progresiva y explícita. Cada funcionalidad nueva está en su propio módulo, con su contrato, su implementación, su servicio y su enrutador juntos.

Las capas antiguas se quedaron como adaptadores mínimos hacia esos módulos. Las dos formas se mantienen a propósito, y el repositorio documenta cuál de las dos recibe el código nuevo.

## Arquitectura

La telemetría del conductor se emite por canales de difusión y llega al pasajero que sigue esa unidad. Las alertas de proximidad usan canales temporales por usuario, que se suscriben, se usan y se cierran.

Nadie introduce a mano el estado del viaje. Se deriva de la posición en vivo comparada con las paradas de la ruta, así que no depende de que el conductor recuerde marcarlo.

## Resultado

La API sirve a los tres roles desde el mismo modelo de datos. El pasajero sigue su unidad, el conductor emite su posición sin operar nada y la administración ve la flota completa.

Dos comprobaciones automáticas protegen el repositorio. Una regla propia del analizador estático rechaza los comentarios en el código. Otra comprobación falla si alguna variable de entorno usada en el código no está declarada en el archivo de ejemplo. Sin ella, ese fallo solo aparece cuando alguien clona el repositorio por primera vez.

## Lo que aprendí

Anunciar la arquitectura nueva no bastó, y el equipo siguió escribiendo código en las carpetas antiguas.

Funcionó dejar la forma antigua operativa como adaptador y escribir en el repositorio cuál de las dos recibe el código nuevo. La convención se cumplió cuando quedó escrita donde el equipo trabaja.
