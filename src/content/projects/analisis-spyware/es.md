---
slug: analisis-spyware
title: Análisis de spyware
tagline: Inventario de las señales que deja este software en el sistema y del control que corta cada paso.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Análisis y contramedidas
period:
  start: '2026'
  end: '2026'
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

Curso de Seguridad de TI I. Ejercicio individual, construido y ejecutado en un laboratorio aislado. El entregable era defensivo: qué señales deja este tipo de software y qué control detiene cada paso.

## Problema

El curso pedía derivar las contramedidas de la observación directa, no de un manual.

Una lista memorizada no dice cuál de ellas funciona. Para saber qué observar y en qué punto del sistema, hay que ver primero qué registros quedan cuando ocurren la captura y la salida de datos.

## Decisiones técnicas

Una herramienta cliente-servidor en Python reproduce a pequeña escala el ciclo de captura y exfiltración, únicamente como generador de actividad para el laboratorio.

El entregable no es esa herramienta sino el inventario que produce: tráfico saliente, accesos a recursos y mecanismos de persistencia, cada uno asociado a un control que lo detiene.

## Arquitectura

Laboratorio cerrado, sin salida a internet y con instantánea previa. La máquina observada y la que recibe están en el mismo segmento aislado, así que todo el tráfico entre ambas puede capturarse y leerse.

Esa disposición es lo que hace medible el ejercicio: qué se toca en el sistema de archivos, qué conexión se abre y en qué momento, y qué queda escrito para sobrevivir a un reinicio.

## Resultado

Un inventario de indicadores y contramedidas derivado de la observación directa: qué mirar, en qué punto del sistema, y qué control cierra cada paso del ataque.

## Lo que aprendí

Las señales más útiles no fueron las de la red, porque un canal cifrado las oculta. Fueron las del sistema de archivos y las del mecanismo de persistencia.

Un control de red por sí solo no habría detectado el ejercicio. La detección venía de correlacionar accesos locales con una conexión saliente, que es justo lo que un único punto de observación no ve.
