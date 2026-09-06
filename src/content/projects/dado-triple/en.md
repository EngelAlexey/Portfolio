---
slug: dado-triple
title: Dado Triple | Multiplayer game
tagline: Web and mobile share an event-contract package, and the client that does not adapt stops compiling.
areas: [movil, fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Development
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

## Context

A Mobile Applications II project, built by a team. A dice game with real-time matches: the phone plays and the web observes the same room.

## Problem

The course asked for a real-time multiplayer game. The team added a web client that observes the same match the phone is playing.

That turned the exercise into two clients written in different technologies over one server, and both had to understand exactly the same messages.

## Technical decisions

If one client added an event and the other did not hear about it, the room broke for half the players. The failure showed up at runtime, not at compile time.

The event contract lives in its own package inside the monorepo, imported by both clients: event names, the shape of each payload, and the functions that serialise and validate.

A new event forces a change to the contract, and the client that does not adapt stops compiling.

The game logic also moved into its own package, with no transport or interface dependencies, so it can be tested without starting a server.

## Architecture

The server holds the rooms and distributes the events. Clients connect through a configurable address, so neither carries a hardcoded URL.

The web joins as an observer and the phone as a player. Same server, same protocol, different role.

## Result

The constraint that shaped the design most was not technical but a service tier: the database's free plan offers no transactions.

Relations were modelled as flat arrays of identifiers rather than references, and the reason was written into the schema itself. Anyone opening it knows why before trying to normalise it.

## What I learned

While the event names lived duplicated in each client, keeping them in sync depended on somebody telling the other side.

Moving them into a shared package turned that notice into a compile error. The cost was setting up the monorepo; after that, a mistyped event never reaches runtime.
