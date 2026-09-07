---
slug: analisis-spyware
title: Análisis de spyware | Señales y contramedidas
tagline: Se construye el spyware para verlo actuar en un laboratorio aislado, y de ese rastro salen las contramedidas, cada una junto al indicador que la dispara.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Análisis de seguridad
period:
  start: '2026-05'
  end: '2026-06'
tier: ficha
home: false
visibility: publico
repo: null
site: null
stack:
  - Python
  - Cliente-servidor
  - Análisis de malware
cover: null
order: null
---

## Contexto

Curso de Seguridad de TI I, el mismo del que salió el [detector de cifrado masivo](/es/proyectos/deteccion-por-umbral). Ejercicio individual: construir una herramienta que reproduzca el ciclo de captura y exfiltración, ejecutarla en un laboratorio aislado y documentar el rastro que deja.

El objetivo del ejercicio es derivar las contramedidas de la observación directa y no de un manual, porque una lista memorizada no dice cuál de sus puntos funciona.

## Problema

Quien defiende un sistema necesita saber en qué punto mirar. Un inventario de controles copiado de una guía no responde a eso: enumera medidas sin decir qué evidencia produce cada ataque ni dónde queda registrada.

Para saber qué observar hay que ver primero qué rastro dejan la captura y la exfiltración cuando ocurren de verdad.

## Decisiones técnicas

Una herramienta cliente-servidor en Python reproduce a pequeña escala el ciclo de captura y exfiltración, únicamente como generador de actividad para el laboratorio.

El entregable no es la herramienta sino el inventario que produce: tráfico saliente, accesos a recursos y mecanismos de persistencia, cada uno asociado a un control que lo detiene y a la evidencia que lo respalda.

## Arquitectura

Laboratorio cerrado, sin salida a internet y con instantánea previa. La máquina observada y la que recibe los datos están en el mismo segmento aislado, así que todo el tráfico entre ambas puede capturarse y leerse.

Esa disposición es lo que hace medible el ejercicio: qué se toca en el sistema de archivos, qué conexión se abre y en qué momento, y qué queda escrito para sobrevivir a un reinicio.

## Resultado

El inventario quedó ordenado por el punto del sistema donde actúa cada control: sistema de archivos, red y mecanismo de arranque. Cada indicador va junto al control que lo corta y junto a la evidencia que lo respalda, tomada del propio laboratorio.

Es un documento que se puede contrastar, porque cada línea remite a una observación concreta y no a una recomendación general.

## Lo que aprendí

Las señales más útiles no fueron las de la red, porque un canal cifrado las oculta. Fueron las del sistema de archivos y las del mecanismo de persistencia.

Un control de red por sí solo no habría detectado el ejercicio. La detección venía de correlacionar accesos locales con una conexión saliente, que es justo lo que un único punto de observación no ve.
