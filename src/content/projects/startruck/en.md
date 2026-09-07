---
slug: startruck
title: Star Track | Trip tracking
tagline: The driver scans the waybill and the phone sends positions until the trip closes. It also reports emergencies and finds services on the road.
areas: [movil]
kind: profesional
org: Star Cargo Service
role: Mobile development
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

Star Track is the app a driver carries through a freight trip. They scan their badge to identify themselves and then the trip's waybill. From that moment the phone sends positions until the trip is closed, with nothing for them to operate.

The app is also their tool on the road: they report an emergency and find the nearest hospital, police station or petrol station without leaving it.

I joined with the app already under way, taking over background tracking.

## Problem

The starting reason was driver safety. A freight trip crosses stretches where a breakdown or an incident leaves a person alone, and the response depends on knowing where they are. Without tracking, that information arrives when the driver manages to send it.

The second reason comes out of the same record. The operation and the client need the load's position while the trip is happening, and without it every enquiry ends in a call to the driver, who is driving.

## Technical decisions

Android does not guarantee the cadence it is asked for. Request a position every five minutes and the system delivers several per second. Ask it not to suspend the foreground service and the manufacturer kills it anyway to save battery. Both behaviours were measured on a real device before any of this was written.

So the app imposes the cadence itself. It accepts whatever the system delivers and discards any point earlier than 80% of the current interval: five minutes in normal running, one in live tracking.

Battery level does not enter the decision. The business requirement is that a point goes out every five minutes at 20% charge with power saving on. A trip with no reports is exactly the case where knowing the vehicle's position matters.

## Architecture

Two independent supervisors restart the foreground service when Android kills it or it stops delivering positions. Each restart also captures a one-off point, because re-arming the service does not always restore delivery.

Points are not sent directly. They enter a local outbox, and a worker syncs it every ten seconds, with growing backoff on failure and without duplicating a point already sent. A tunnel or a dead zone delays delivery without losing points.

## Result

The phone holds the cadence through a whole trip with no intervention from the driver. The operation and the client can see where the load is without calling anyone.

The app also reports with the vehicle stopped: a driver held three hours at customs still produces a point every five minutes. That is deliberate, because those repeated points are what distinguishes a stopped vehicle from a phone that stopped reporting.

## What I learned

Android's documentation describes the position interval as a request, not a guarantee. On a real device the difference was several positions per second against one every five minutes.

Measuring that behaviour on the handset before designing the solution saved the work of building on a promise the system does not keep. With an operational requirement at stake, measurement on the actual device is worth more than the specification.
