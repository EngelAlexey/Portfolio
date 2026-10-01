---
slug: dado-triple
title: Dado Triple | Juego multijugador
tagline: El móvil juega y la web sigue la misma partida, con los mensajes definidos una sola vez para los dos.
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

Es un juego de dados con partidas en tiempo real, hecho en equipo para el curso Aplicaciones Móviles II.

El curso pedía un juego multijugador. El equipo añadió por decisión propia un cliente web que sigue la partida desde otra pantalla, mientras el móvil juega.

## Problema

Una partida en tiempo real falla para todos en cuanto un cliente deja de entender lo que envía el otro. Aquí, dos clientes escritos con tecnologías distintas tenían que entender exactamente los mismos mensajes de un mismo servidor.

Con los nombres de evento duplicados en cada cliente, mantenerlos iguales dependía de que alguien avisara a quien mantenía el otro. Si un cliente añadía un evento y el otro no se enteraba, la sala dejaba de funcionar para la mitad de los jugadores. El fallo aparecía al ejecutar la aplicación, no al compilarla.

## Decisiones técnicas

El contrato de eventos pasó a un paquete propio del monorepo, que importan los dos clientes. Contiene los nombres de evento, la forma de cada mensaje y las funciones que los serializan y validan. Con él, el compilador comprueba los dos clientes contra la misma definición.

La lógica del juego también pasó a su propio paquete, sin dependencias de transporte ni de interfaz, para probarla sin arrancar el servidor.

Las relaciones se modelaron como arreglos planos de identificadores, porque el nivel gratuito de la base de datos no ofrece transacciones. El motivo quedó anotado en el propio esquema, para que nadie intente normalizarlo sin saber por qué está así.

## Arquitectura

El servidor mantiene las salas y distribuye los eventos. Los clientes se conectan a una dirección configurable, así que ninguno lleva una URL fija en el código.

La web entra como observadora y el móvil como jugador, con el mismo servidor y el mismo protocolo.

## Resultado

Las partidas funcionan en tiempo real con los dos clientes en la misma sala y un solo servidor.

Un evento que un cliente cambia y el otro no recoge produce un error de compilación, antes de que nadie abra la aplicación.

## Lo que aprendí

Conseguirlo obligó a montar el monorepo: configuración, herramientas y una estructura que el proyecto no necesitaba para nada más.

Con dos clientes, ese trabajo se hace una sola vez y el aviso de desajuste pasa a ser automático. Con un solo cliente, el monorepo no se habría justificado.
