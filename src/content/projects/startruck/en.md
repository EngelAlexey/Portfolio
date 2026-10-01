---
slug: startruck
title: Star Track | Trip tracking
tagline: The driver's phone sends the trip's position until it closes and lets them report emergencies on the road.
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

Star Track is the app a driver carries through a freight trip. They scan their badge to identify themselves and then the trip's waybill. From that moment, the phone sends positions until the trip is closed, without the driver having to do anything. On the road it is also their tool for reporting an emergency and finding the nearest hospital, police station or petrol station.

The app was built by another developer on the team. I joined with it already under way, to fix the defects that appeared when testing it on a real device and reviewing the service in production.

## Problem

The company needs the position of a trip while it is happening, and the driver needs to call for help from the road without looking up a number.

The record therefore has to come from the phone itself and work unattended for hours. A trip that stops reporting without anyone noticing leaves the freight untracked until somebody asks about it.

## Technical decisions

None of the defects were visible from reading the code. They appeared when running the app on a real phone and following the behaviour of the deployed service.

The five-minute cadence did not exist: the phone stored a point every twenty-seven seconds, ten times the rows budgeted. When tracking stopped, re-arming the service did not bring it back. On top of that, the trip screen failed when closing the operation and left the driver facing a blank screen at the end of the trip.

Android treats the requested position interval as the desired one, not as a minimum, and the request was registered without a minimum interval. The app now imposes the cadence itself. It accepts whatever the system delivers and discards any point that arrives before eighty per cent of the current interval.

Re-arming the service is not enough, so each watchdog retry also captures a one-off point. The two existing recovery mechanisms sit inside the phone, and once the process has ended none of the app's code runs. A check was therefore added on the server, the only one that does not depend on Android.

That alert would never have fired. The MySQL driver returned dates in the process timezone, while the database stores them in UTC. The subtraction came out negative, with no error and no log entry. The time without reports is now calculated in SQL against the server's UTC time.

## Architecture

The phone runs a foreground service that collects positions. Points are not sent directly. They go into a local outbox, and a task syncs it every few seconds, with a growing wait after failures and without duplicating points already sent. A tunnel or an area without coverage delays the upload, but no point is lost.

On top of that there are three recovery mechanisms, ordered by how much they depend on the phone:

1. Two watchdogs inside the app restart it when Android ends its process.
2. A scheduled notification fires if tracking stops capturing, and it stays active even after the process ends.
3. A check on the server alerts Operations when an active trip has gone fifteen minutes without reporting.

## Result

The cadence went from a point every twenty-seven seconds to the configured interval, with the reduction in rows that implies for the tracking table. The trip screen stopped failing when closing the operation.

A trip that stops reporting no longer depends on someone noticing. The alert comes from the server, the only one of the three mechanisms that keeps working with the phone switched off.

## What I learned

Android's documentation describes the position interval as a request, not a guarantee. On a real device, the difference was a point every twenty-seven seconds against one every five minutes, and no reading of the code would have shown it.

Two of the defects produced no visible failure. The timezone one gave no error and left no log entry, because the condition never held. They only appeared when testing against the real system.
