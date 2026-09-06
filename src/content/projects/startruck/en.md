---
slug: startruck
title: Star Track | Trip tracking
tagline: An Android app for the driver on the road. Emergencies, nearby services, and the position cadence Android does not guarantee.
areas: [movil]
kind: profesional
org: Star Cargo Service
role: Background tracking
period:
  start: '2026-07'
  end: '2026-08'
tier: ficha
home: false
visibility: privado
repo: null
site: null
stack:
  - React Native (Expo)
  - TypeScript
  - SQLite
  - Node.js
  - MySQL
  - Vercel
cover: null
order: null
---

## Context

The driver scans their credential to identify themselves, then the waybill for the trip. From that point the phone sends positions until the trip is closed, with nothing for them to operate.

The app is also their tool on the road: it reports an emergency and locates the nearest hospital, police station or petrol station without leaving it.

I joined with the app already running, responsible for background tracking.

## Problem

The starting objective was driver safety. A freight trip crosses stretches where a breakdown or an incident leaves someone on their own, and the response depends on knowing where they are.

The same record delivers the second objective: operations and the client know where the cargo is at any moment, without calling anyone. That means the phone has to report on its own for hours, with nobody attending to it.

## Technical decisions

`timeInterval` guarantees nothing on Android. Ask for a position every five minutes and the system delivers several a second. Ask it not to suspend the foreground service and the handset maker kills it anyway to save battery. Both behaviours were measured on a real device.

So the app sets the cadence. It accepts whatever the system delivers and discards any point that arrives before 80% of the current interval: five minutes on a normal run, one minute in live tracking.

Battery level plays no part in the decision. The function keeps the parameter for signature compatibility and ignores it deliberately. The requirement is that a point goes out every five minutes at 20% charge with power saving on.

## Architecture

Two independent watchdogs restart the foreground service when Android kills it or it stops delivering positions. Each restart also captures a one-off point, because rearming the service does not always restore delivery.

Points are not sent directly. They go into a SQLite outbox. A worker syncs it every ten seconds, with growing backoff on failure and idempotency by client identifier. A tunnel or a dead zone delays the upload without losing points.

## Result

The phone holds the cadence across a whole trip with no input from the driver.

The app also reports with the vehicle stopped: a driver parked three hours at customs still produces a point every five minutes. That is deliberate, because those repeated points are what separates a stationary vehicle from a phone that stopped reporting.

## What I learned

The function that decides whether a point goes out still takes a battery-level parameter it ignores, kept for signature compatibility. Anyone reading the call without opening it will assume the app backs off on low charge; it does not. The requirement is a point every five minutes at 20% with battery saver on.
