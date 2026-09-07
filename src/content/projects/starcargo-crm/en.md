---
slug: starcargo-crm
title: Star CRM | Sales management
tagline: Clients, contacts, quotes, appointments and shipment deals in a single record. Permission by role and branch is enforced on the server and in the database.
areas: [fullstack, seguridad]
kind: profesional
org: Star Cargo Service
role: Development
period:
  start: '2026-01'
  end: '2026-04'
tier: ficha
home: true
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
order: 4
---

## Context

A bespoke CRM for a freight company with several branches. It handles clients, contacts, shipment deals, appointments, quotes and branches, and it is the record where sales executives keep their day-to-day work.

The project was commissioned because the sales operation was growing and none of its information lived in a system. It lived in spreadsheets spread across the people who wrote them.

## Problem

Each executive kept their work in a spreadsheet and sent it to management. Someone there copied that data into the rest of the files.

The same information was written several times, consolidation depended on a person doing it by hand, and management only saw the state of the pipeline once that work finished. With several branches operating this way, no version of the file was the right one.

## Technical decisions

Centralising the record turns read permission into a rule that has to be applied on every query, and that rule changes whenever the company reorganises a role.

So permissions live in a table rather than in code. A decorator marks what each endpoint requires and a guard checks it before anything runs. Changing what a role can do is editing a row, not shipping a version.

The ORM was dropped halfway through the project. Services moved to talking to the database through the Supabase client, which carries the user's identity and is therefore subject to row-level policies. An ORM with its own connection would have left those out, and isolation between branches would have rested on application code alone.

## Architecture

A Next.js client and a NestJS server in one repository. Supabase issues the session and the server validates the token itself, rather than trusting that the client already did.

There are two permission layers answering different questions. The server guard decides whether the request may proceed. The database's row-level policies decide which rows the query returns.

Almost every entity carries its branch, and the user picks which one is active. The profile, assigned branches and per-role permissions are followed in real time, so a role change shows up in the interface without a reload.

## Result

The CRM replaced the spreadsheet operation. Clients, contacts, shipment deals, appointments, quotes and branches live in a single record, and the system does the consolidation instead of a person.

The design was tested by an executive getting a 403 when opening the dashboard: the indicators demanded reporting permission when the data they returned was deal data. The required permission was lowered after confirming that the service already isolated records per user.

## What I learned

The server authorised an administrative operation with its guard and then used the user's restricted token to write it. The database then rejected a write the application had already approved.

The two layers answer different questions and do not stand in for each other. The fix was to use the service identity for that write, and only after the guard had authorised it. Repeating a check across two layers is not waste when each one answers something different, but it does require knowing which answers what.
