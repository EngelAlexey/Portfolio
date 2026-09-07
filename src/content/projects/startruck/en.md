---
slug: startruck
title: Star Track | Trip tracking
tagline: The driver scans the waybill and the phone sends positions until the trip closes. It also reports emergencies and finds services on the road.
areas: [movil]
kind: profesional
org: Star Cargo Service
role: Maintenance and bug fixing
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
  - Render
cover: null
order: null
---

## Context

Star Track is the app a driver carries through a freight trip. They scan their badge to identify themselves and then the trip's waybill. From that moment the phone sends positions until the trip is closed, with nothing for them to operate. On the road it is also their tool for reporting an emergency and finding the nearest hospital, police station or petrol station.

The app was built by another developer on the team. I joined with it already under way, to fix the defects that surfaced running it on a real device and watching the service in production.

## Problem

The company needs the position of a trip while it is happening, and the driver needs to call for help from the road without looking up a number.

That forces the record to come off the phone itself and hold up on its own for hours. A trip that stops reporting without anyone noticing leaves the freight untracked until somebody asks after it.

## Technical decisions

None of the defects were visible reading the code. They surfaced running the app on an actual handset and following the behaviour of the already deployed service.

The five-minute cadence did not exist: the phone stored a point every twenty-seven seconds, ten times the rows budgeted. When tracking stopped, re-arming the service did not bring it back. And the trip screen crashed on closing the operation, leaving the driver looking at a blank screen exactly as the trip ended.

The position interval requested from Android is the desired one, not a minimum, and the request was registered with no floor. So the app now imposes the cadence itself: it accepts whatever the system delivers and discards any point earlier than eighty per cent of the current interval.

Re-arming the service is not enough, so each watchdog retry also captures a one-off point. And since both existing recovery nets live inside the phone, where none of our code runs once the process is dead, a check was added on the server: it is the only one that does not depend on Android.

That alert would never have fired. The MySQL driver returned dates in the process timezone while the database stores them in UTC, so the subtraction came out negative, with no error and no log entry. Silence is now computed in SQL against the server's UTC time.

## Architecture

The phone runs a foreground service that collects positions. Points are not sent directly: they enter a local outbox, and a worker syncs it every few seconds, with growing backoff on failure and without duplicating a point already sent. A tunnel or a dead zone delays delivery without losing points.

On top of that sit three recovery nets, ordered by how much they depend on the handset. Two watchdogs inside the app restart it when Android kills it. A scheduled notification fires if tracking stops capturing, and it survives the death of the process. And a check on the server alerts Operations when an active trip has gone fifteen minutes without reporting.

## Result

The cadence went from a point every twenty-seven seconds to the configured interval, with the reduction in rows that implies on the tracking table. The trip screen stopped crashing on closing the operation.

A trip that stops reporting no longer depends on someone noticing. The alert comes from the server, the only one of the three layers that keeps working with the phone switched off.

## What I learned

Android's documentation describes the position interval as a request, not a guarantee. On a real device the difference was a point every twenty-seven seconds against one every five minutes, and no amount of reading the code would have shown it.

The two most expensive defects did not fail visibly. The timezone one produced no error and no log: the condition simply never held. Testing against the real system is what brought them out.
