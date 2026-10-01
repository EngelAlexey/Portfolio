---
slug: rastreo-buses
title: Bus tracking | Public transport
tagline: The passenger follows the bus live, the driver reports and administration supervises the fleet from the same system.
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
  - OpenAPI
cover: null
shots:
  - src: /img/shots/bus-api-docs.jpg
    alt: "Swagger UI of the tracking API, with the system's modules listed: authentication, incidents, routes, trips, drivers and telemetry"
    caption: "The API contract in Swagger. Each module of the system is a documented group of routes."
  - src: /img/shots/bus-api-incidente.jpg
    alt: "Detail of one route in Swagger: the incident report, with the request body and the 201 and 400 responses with their examples"
    caption: "One route from the inside: the incident report, with its request and the success and validation responses."
  - src: /img/shots/bus-app-pasajero.jpg
    alt: "Passenger mobile app: home screen with available trips San José–Alajuela and San José–Puntarenas, marked on route and live"
    caption: "The passenger app (the team's mobile client) over the API: the live trips with their on-route status."
  - src: /img/shots/bus-login-admin.jpg
    alt: "Sign-in screen of the administration console, with the brand panel and the admin-restricted login form"
    caption: "The administration console, the entry to the dashboard that consumes the same API."
order: null
---

## Context

Integrative Project III, done in a team of five. The system tracks buses live and serves three roles: the passenger waiting, the driver at the wheel and the administration supervising the fleet.

I contributed most of the API and designed the interface of the mobile client and the web dashboard. My teammates built them on that design and reshaped it as they went.

## Problem

A public-transport passenger does not know when their bus is coming. They wait at the stop with no information, and the only alternative is a published timetable that traffic alters every day.

The administration does not know where its fleet is while it operates either. It finds out about a delay when somebody reports it.

The three roles need a different fact about the same trip, and none of them had it:

- the passenger, knowing when their bus arrives;
- the driver, reporting without being distracted;
- the administration, seeing the whole fleet at once.

## Technical decisions

The project started on the classic layered architecture: routes, controllers, services and repositories. It grew until finding a feature meant opening five folders. Rewriting it wholesale was not an option with the course running and five other people working on the same repository.

The migration was gradual and explicit. Every new feature sits in its own module, with its contract, its implementation, its service and its router together.

The old layers stayed on as minimal adapters onto those modules. Both shapes are kept on purpose, and the repository documents which of the two receives new code.

## Architecture

Driver telemetry is emitted over broadcast channels and reaches the passenger following that bus. Proximity alerts use temporary per-user channels, which are subscribed to, used and closed.

Nobody enters the trip state by hand. It is derived from the live position compared with the route's stops, so it does not depend on the driver remembering to set it.

## Result

The API serves all three roles from the same data model. The passenger follows their bus, the driver emits their position without operating anything and the administration sees the whole fleet.

Two automated checks protect the repository. A custom static-analysis rule rejects comments in the code. Another check fails if any environment variable used in the code is not declared in the example file. Without it, that fault only appears when somebody clones the repository for the first time.

## What I learned

Announcing the new architecture was not enough, and the team kept writing code in the old folders.

What worked was leaving the old shape operational as an adapter and writing down in the repository which of the two receives new code. The convention was followed once it was written where the team works.
