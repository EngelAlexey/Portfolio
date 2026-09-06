---
slug: dado-triple
title: Dado Triple | Juego multijugador
tagline: Web y móvil comparten un paquete de contrato de eventos, y el cliente que no se adapte deja de compilar.
areas: [movil, fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Desarrollo
period:
  start: '2026-04'
  end: '2026-05'
tier: ficha
home: false
visibility: publico
repo: https://github.com/EngelAlexey/proyecto-moviles-II
site: null
stack:
  - TypeScript
  - Next.js
  - Expo
  - Express
  - MongoDB
  - Prisma
  - Redis
  - Turborepo
cover: null
order: null
---

## Contexto

Proyecto de Aplicaciones Móviles II, en equipo. Un juego de dados con partidas en tiempo real: el móvil juega y la web observa la misma sala.

## Problema

El curso pedía un juego multijugador en tiempo real. El equipo añadió un cliente web que observa la misma partida que juega el móvil.

Eso convirtió el ejercicio en dos clientes escritos con tecnologías distintas sobre un mismo servidor, y ambos tenían que entender exactamente los mismos mensajes.

## Decisiones técnicas

Si un cliente añadía un evento y el otro no se enteraba, la sala se rompía para la mitad de los jugadores. El fallo aparecía en ejecución, no al compilar.

El contrato de eventos vive en un paquete propio del monorepo que ambos clientes importan: nombres de evento, forma de cada carga útil y las funciones que serializan y validan.

Un evento nuevo obliga a tocar el contrato, y el cliente que no se adapte deja de compilar.

La lógica del juego también salió a su propio paquete, sin dependencias de transporte ni de interfaz, para poder probarla sin levantar servidor.

## Arquitectura

El servidor mantiene las salas y reparte los eventos. Los clientes se conectan por dirección configurable, así que ninguno lleva una URL fija en el código.

La web entra como observadora y el móvil como jugador. Es el mismo servidor y el mismo protocolo, con distinto papel.

## Resultado

La restricción que más moldeó el diseño no fue técnica sino del plan de servicio: el nivel gratuito de la base de datos no ofrece transacciones.

Las relaciones se modelaron como arreglos planos de identificadores en lugar de referencias, y el motivo quedó anotado en el propio esquema. Quien lo abra sabe por qué está así antes de intentar normalizarlo.

## Lo que aprendí

Mientras los nombres de evento vivieron duplicados en cada cliente, mantenerlos sincronizados dependía de que alguien avisara al otro lado.

Moverlos a un paquete compartido convirtió ese aviso en un error de compilación. El costo fue montar el monorepo; a partir de ahí, un evento mal escrito no llega a ejecutarse.
