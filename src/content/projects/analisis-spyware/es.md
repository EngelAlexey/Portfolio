---
slug: analisis-spyware
title: Análisis de spyware en entorno controlado
tagline: Herramienta cliente-servidor en laboratorio aislado para estudiar la captura y exfiltración de datos, y derivar de ahí las contramedidas.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Individual
period:
  start: '2026'
  end: '2026'
tier: ficha
home: true
visibility: publico
repo: null
demo: null
stack:
  - Python
  - Cliente-servidor
  - Análisis de malware
cover: null
order: 3
---

## Contexto

Curso de Seguridad Informática. Ejercicio individual, construido y ejecutado en un laboratorio aislado, con un objetivo académico: entender un vector de ataque lo suficiente como para defenderlo.

## Problema

Las contramedidas que se aprenden de memoria no se sostienen. Para saber qué señales deja el spyware y qué controles lo cortan de verdad, hay que ver primero cómo captura y saca los datos.

## Decisiones técnicas

Herramienta cliente-servidor en Python que reproduce, en pequeño, el ciclo de captura y exfiltración. El foco no es la herramienta: es la lista de señales que deja a su paso — tráfico saliente, accesos a recursos, persistencia — y el mapeo de cada una a un control que la detiene.

## Resultado

Un inventario de indicadores y contramedidas derivado de la observación directa, no de un manual: qué mirar, dónde, y qué control cierra cada paso del ataque.

## Lo que aprendí

Que entender el vector es lo que permite defenderlo. El ejercicio ofensivo era el medio; el entregable real era la defensa.
