---
slug: starcargo-crm
title: Star CRM
tagline: Four roles and several branches over the same data. Permission is enforced on the server and in the database.
areas: [fullstack, seguridad]
kind: profesional
org: Star Cargo Service
role: Development
period:
  start: '2026-01'
  end: '2026-04'
tier: ficha
home: false
visibility: privado
repo: null
site: null
stack:
  - Next.js
  - React
  - TypeScript
  - NestJS
  - Supabase
  - PostgreSQL
  - Playwright
cover: null
order: null
---

## Context

A bespoke CRM for a freight company. It handles clients, contacts, shipping deals, appointments, quotes and branches, and replaces the operation that used to live in spreadsheets.

## Problem

Each rep recorded their activity in a spreadsheet and sent it to management. Somebody there carried that data into the rest of the files. The same information was written several times, and consolidation depended on somebody doing it by hand.

With six branches working that way, the goal was to centralise the record and let the system do the consolidation. Centralising it also turns "who sees what" into a rule that has to be applied on every query.

## Technical decisions

Permissions live in a table, not in the code. A decorator marks what each endpoint requires and a guard checks it before anything runs. Changing what a role can do means editing a row, not deploying.

The ORM was removed halfway through. Services moved to talking to the database through the Supabase client. That client carries the user's identity, so it stays subject to the row-level policies. An ORM opening its own connection would have left them out.

## Architecture

A Next.js client and a NestJS server in one repository. The session is issued by Supabase, and the server validates the token itself rather than trusting that the client already did.

There are two permission layers answering different questions. The server's guard decides whether the request proceeds. The database's row-level policies decide which rows the query returns.

Almost every entity carries its branch, and the user picks which one is active. Real-time subscriptions watch the profile, the assigned branches and the per-role permissions. A role change shows up in the interface without a reload.

## Result

The case that tested the design was a sales rep getting 403 on opening the dashboard. The indicators required reporting permission, when the data they returned was deal data.

The required permission was lowered after confirming the service already isolated records per user. The permission asked for was higher than the data handed back, and that is a design error too.

## What I learned

The server authorised an administrative operation with its guard and then used the user's restricted token to write it. The database refused a write the application had already approved.

The two layers are not the same check repeated. The guard decides whether the operation proceeds; the database decides which identity it runs as. The fix was to use the service identity for that write, and only after the guard had authorised it.
