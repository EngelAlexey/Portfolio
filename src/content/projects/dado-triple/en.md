---
slug: dado-triple
title: Dado Triple | Multiplayer game
tagline: Real-time dice matches, with mobile playing and the web watching the same room. Both clients share one event-contract package.
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

A Mobile Applications II project, built as a team. A dice game with real-time rounds: the phone plays and the web watches the same room.

The course asked for a real-time multiplayer game. The team added the web client on its own initiative, so that a round could be followed from a screen other than the one playing it.

## Problem

A real-time round breaks for everyone the moment one client stops understanding what the other sends. Two clients written in different technologies had to understand exactly the same messages over one server.

With event names duplicated in each client, keeping them in step depended on somebody telling the other side. If one client added an event and the other did not hear about it, the room broke for half the players, and the fault showed up at runtime rather than at compile time.

## Technical decisions

The event contract moved into its own package in the monorepo that both clients import: event names, the shape of each message, and the functions that serialise and validate. From there, a mismatch between clients is a compile error.

The game logic also moved into its own package, with no transport or interface dependencies, so it can be tested without starting a server.

Relations were modelled as flat arrays of identifiers because the database's free tier offers no transactions. The reason was noted in the schema itself, so that whoever opens it does not try to normalise it without knowing why it is that way.

## Architecture

The server holds the rooms and dispatches events. Clients connect through a configurable address, so neither carries a fixed URL in its code.

The web joins as an observer and the phone as a player. Same server, same protocol, different role.

## Result

The phone plays and the web watches the same room in real time against a single server, each client in its role.

The shared contract turned what used to be a runtime fault into a compile error, so a mismatch between clients is caught before anyone opens the app.

## What I learned

The cost of getting there was setting up the monorepo: configuration, tooling and a structure the project needed for nothing else.

With two clients that cost is paid once and the warning becomes automatic. With a single client it would not have paid off, and it is the number of consumers of the contract that decides the answer.
