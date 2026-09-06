---
slug: rastreo-buses
title: Bus tracking | One API, three roles
tagline: One API for passenger, driver and administration, migrating from technical layers to feature modules.
areas: [movil, fullstack]
kind: academico
org: Universidad Técnica Nacional
role: API and backend
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

Integrative Project III, built by a team of six. I was the main contributor to the API; the mobile client and the web panel were carried mostly by other teammates.

The system tracks buses live and serves three roles: passenger, driver and administration.

## Problem

The course asked for live tracking of a bus fleet for three roles: the passenger waiting, the driver at the wheel and the administration supervising.

Each needs a different fact about the same trip. A passenger wants to know when their bus arrives; administration wants to know where the whole fleet is at once.

## Technical decisions

The project started with the classic layering (routes, controllers, services, repositories) and grew until locating one feature meant opening five folders. Rewriting it wholesale was not an option with the course running and five other people on the same repository.

The migration was gradual and explicit. Every new feature lives in its own module, with its contract, its implementation, its service and its router together.

The old layers remained as thin adapters onto those modules. Both shapes coexist deliberately, and the repository documents which of the two receives new code.

## Architecture

Driver telemetry is emitted over broadcast channels and reaches the passenger following that unit. Proximity alerts use per-user temporary channels that are subscribed, used and closed.

Trip state is not typed in by anyone: it is derived from the live position against the route's stops.

## Result

The API serves all three roles from the same data model: the passenger follows their unit, the driver emits position, and administration sees the whole fleet.

Two automated guards protect the repository. A custom static-analysis rule rejects comments in the code. A verification step fails if any environment variable used in the code is not declared in the example file, which is the failure that only appears when somebody clones the repository for the first time.

## What I learned

Announcing the new architecture was not enough, and code kept landing in the old folders. What did work was leaving the old shape operational as an adapter and writing into the repository which of the two receives new code.
