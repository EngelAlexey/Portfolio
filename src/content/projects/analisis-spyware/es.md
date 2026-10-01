---
slug: analisis-spyware
title: Análisis de spyware | Señales y contramedidas
tagline: Spyware de laboratorio construido para observar su rastro y derivar de él una contramedida por cada indicador.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Análisis de seguridad
period:
  start: '2026-03'
  end: '2026-03'
tier: ficha
home: false
visibility: publico
repo: https://github.com/EngelAlexey/spyware
site: null
stack:
  - Python
  - Cliente-servidor
  - Análisis de malware
cover: null
order: null
---

## Contexto

Es un ejercicio individual del curso Seguridad de TI I, el mismo del que salió el [detector de cifrado masivo](/es/proyectos/deteccion-por-umbral). Consistió en construir una herramienta que reproduce el ciclo de captura y exfiltración, ejecutarla en un laboratorio aislado y documentar el rastro que deja.

El ejercicio pide derivar las contramedidas de la observación directa, porque una lista memorizada de un manual no dice cuál de sus puntos funciona.

## Problema

Quien defiende un sistema necesita saber dónde buscar la evidencia de un ataque. Un inventario de controles copiado de una guía no lo dice: enumera medidas sin decir qué evidencia produce cada ataque ni dónde queda registrada.

Para saberlo, primero hay que observar qué rastro dejan la captura y la exfiltración cuando ocurren.

## Decisiones técnicas

Una herramienta cliente-servidor en Python reproduce a pequeña escala el ciclo de captura y exfiltración. Solo sirve para generar actividad en el laboratorio.

El entregable es el inventario que esa actividad produce: tráfico saliente, accesos a recursos y mecanismos de persistencia. Cada entrada lleva el control que la detiene y la evidencia que la respalda.

## Arquitectura

El laboratorio está cerrado, sin salida a internet, y se tomó una instantánea antes del ejercicio. La máquina observada y la que recibe los datos están en el mismo segmento aislado, así que todo su tráfico se puede capturar y leer.

Así se mide qué toca la herramienta en el sistema de archivos, qué escribe para seguir activa tras un reinicio y en qué momento abre cada conexión.

## Resultado

El inventario quedó ordenado por el punto del sistema donde actúa cada control: el sistema de archivos, la red y el mecanismo de arranque. Cada indicador aparece junto al control que lo detiene y a la evidencia que lo respalda, tomada del propio laboratorio.

Cada línea remite a una observación del laboratorio, así que el documento se puede contrastar.

## Lo que aprendí

Las señales más útiles fueron las del sistema de archivos y las del mecanismo de persistencia. Las de la red sirvieron menos, porque un canal cifrado las oculta.

Un control de red por sí solo no habría detectado el ejercicio. La detección salió de correlacionar los accesos locales con una conexión saliente. Un único punto de observación no puede hacer esa correlación.
