---
slug: dado-triple
title: Dado Triple | Multiplayer game
tagline: The phone plays and the web follows the same match, with the messages defined once for both.
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

A dice game with real-time matches, built as a team for the Mobile Applications II course.

The course asked for a multiplayer game. On its own initiative, the team added a web client that follows the match from another screen while the phone plays.

## Problem

A real-time match fails for everyone as soon as one client stops understanding what the other sends. Here, two clients written in different technologies had to understand exactly the same messages from one server.

With the event names duplicated in each client, keeping them identical depended on someone telling whoever maintained the other one. If one client added an event and the other did not hear about it, the room stopped working for half the players. The fault showed up when the app ran, not when it compiled.

## Technical decisions

The event contract moved into its own package in the monorepo, which both clients import. It holds the event names, the shape of each message and the functions that serialise and validate them. With it, the compiler checks both clients against the same definition.

The game logic also moved into its own package, with no transport or interface dependencies, so it can be tested without starting the server.

Relations were modelled as flat arrays of identifiers, because the database's free tier offers no transactions. The reason is noted in the schema itself, so that nobody tries to normalise it without knowing why it is that way.

## Architecture

The server holds the rooms and distributes the events. Clients connect to a configurable address, so neither carries a fixed URL in its code.

The web joins as an observer and the phone as a player, with the same server and the same protocol.

## Result

Matches run in real time with both clients in the same room and a single server.

An event that one client changes and the other does not pick up produces a compile error, before anyone opens the app.

## What I learned

Getting there meant setting up the monorepo: configuration, tooling and a structure the project needed for nothing else.

With two clients, that work is done once and the mismatch warning becomes automatic. With a single client, the monorepo would not have been justified.
