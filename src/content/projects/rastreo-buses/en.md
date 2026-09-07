---
slug: rastreo-buses
title: Bus tracking | Public transport
tagline: The passenger follows the bus live, the driver reports and administration supervises, all three over the same API.
areas: [movil, fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Backend development
period:
  start: '2026-05'
  end: '2026-07'
tier: ficha
home: false
visibility: publico
repo: https://github.com/utn-integrador-III/2026-bus-tracking-api
site: null
stack:
  - TypeScript
  - JavaScript
  - Express
  - Supabase
  - PostgreSQL
  - Expo
  - Next.js
  - Jest
cover: null
order: null
---

## Context

Integrative Project III, in a team of six. The system tracks buses live and serves three roles: the passenger waiting, the driver at the wheel, and the administration supervising the fleet.

I contributed most of the API. The mobile client and the web dashboard were mainly led by other teammates.

## Problem

A public-transport passenger does not know when their bus is coming. They wait at the stop with no information, and the only alternative is a published timetable that traffic contradicts every day.

On the other side, the administration does not know where its fleet is while it operates. It finds out about a delay when somebody reports it.

The three roles need different facts about the same trip, and none of them had any: the passenger wants to know when their bus arrives, the driver wants to report without being distracted, the administration wants to see the whole fleet at once.

## Technical decisions

The project started on the classic layered architecture, with routes, controllers, services and repositories, and grew until finding a feature meant opening five folders. Rewriting it wholesale was not an option with the course running and five other people on the same repository.

The migration was gradual and explicit. Every new feature lives in its own module, with its contract, its implementation, its service and its router together.

The old layers stayed on as thin adapters onto those modules. Both shapes coexist on purpose, and the repository documents which of the two receives new code.

## Architecture

Driver telemetry is emitted over broadcast channels and reaches the passenger following that bus. Proximity alerts use temporary per-user channels, which are subscribed to, used and closed.

Trip state is not entered by anyone: it is derived from live position against the route's stops, so it does not depend on the driver remembering to set it.

## Result

The API serves all three roles from the same data model. The passenger follows their bus, the driver emits position without operating anything, and the administration sees the whole fleet.

Two automated checks protect the repository. A custom static-analysis rule rejects comments in the code. A verification fails if any environment variable used in the code is not declared in the example file. That is the failure that only appears when somebody clones the repository for the first time.

## What I learned

Announcing the new architecture was not enough, and code kept going into the old folders.

What did work was leaving the old shape operational as an adapter and writing down in the repository which of the two receives new code. On a team, a change of convention holds because a rule is written where the work happens, not because of a verbal agreement.
