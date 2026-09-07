---
slug: dado-triple
title: Dado Triple | Juego multijugador
tagline: Partidas de dados en tiempo real, con el móvil jugando y la web observando la misma sala. Ambos clientes comparten un paquete de contrato de eventos.
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

El curso pedía un juego multijugador en tiempo real. El equipo añadió el cliente web por decisión propia, para que una partida pudiera seguirse desde una pantalla distinta a la que juega.

## Problema

Dos clientes escritos con tecnologías distintas tenían que entender exactamente los mismos mensajes sobre un mismo servidor.

Con los nombres de evento duplicados en cada cliente, mantenerlos sincronizados dependía de que alguien avisara al otro lado. Si un cliente añadía un evento y el otro no se enteraba, la sala se rompía para la mitad de los jugadores, y el fallo aparecía en ejecución y no al compilar.

## Decisiones técnicas

El contrato de eventos salió a un paquete propio del monorepo que ambos clientes importan: nombres de evento, forma de cada mensaje y las funciones que serializan y validan. Desde ahí, un desajuste entre clientes es un error de compilación.

La lógica del juego también salió a su propio paquete, sin dependencias de transporte ni de interfaz, para poder probarla sin levantar servidor.

Las relaciones se modelaron como arreglos planos de identificadores porque el nivel gratuito de la base de datos no ofrece transacciones. El motivo quedó anotado en el propio esquema, para que quien lo abra no intente normalizarlo sin saber por qué está así.

## Arquitectura

El servidor mantiene las salas y reparte los eventos. Los clientes se conectan por dirección configurable, así que ninguno lleva una URL fija en el código.

La web entra como observadora y el móvil como jugador. Es el mismo servidor y el mismo protocolo, con distinto rol.

## Resultado

El móvil juega y la web observa la misma sala en tiempo real contra un solo servidor, cada cliente en su rol.

El contrato compartido convirtió en error de compilación lo que antes era un fallo en ejecución, así que el desajuste entre clientes se detecta antes de que nadie abra la aplicación.

## Lo que aprendí

El coste de conseguirlo fue montar el monorepo: configuración, herramientas y una estructura que el proyecto no necesitaba para nada más.

Con dos clientes ese coste se paga solo la primera vez y el aviso pasa a ser automático. Con uno solo no habría compensado, y es la cantidad de consumidores del contrato lo que decide la respuesta.
