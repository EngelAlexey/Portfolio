---
slug: starcargo-crm
title: Star CRM | Sales management
tagline: Replaces the spreadsheets of several branches with a single record, with permissions by role and branch.
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

A bespoke CRM for Star Cargo Service, a freight company with several branches. It handles clients, contacts, shipment deals, appointments, quotes and branches, and it is the record where sales executives keep their day-to-day work.

The project was commissioned because the sales operation was growing and its information was in no system at all. It sat in spreadsheets spread across the people who wrote them.

## Problem

Each executive kept their work in a spreadsheet and sent it to management. Someone there copied that data into the rest of the files.

The same information was written several times, and consolidation depended on a person doing it by hand. Management only saw the state of the pipeline once that work was finished. With several branches working this way, no version of the file was the right one.

## Technical decisions

Centralising the record turns read permission into a rule that has to be applied on every query. That rule also changes whenever the company reorganises a role.

So permissions sit in a table rather than in code. A decorator marks what each API route requires, and a *guard* (the NestJS class that authorises a request) checks it before anything runs. Changing what a role can do means editing a row, not shipping a version.

The ORM was removed halfway through the project. Services moved to querying the database through the Supabase client, which carries the user's identity and is therefore subject to row-level policies. An ORM with its own connection would have bypassed them, and isolation between branches would have rested on application code alone.

## Architecture

The client uses Next.js and the server NestJS, in one repository. Supabase issues the session and the server validates the token itself, instead of trusting that the client already did.

There are two permission layers that answer different questions. The server's *guard* decides whether the request may proceed, and the database's row-level policies decide which rows the query returns.

Almost every entity carries its branch, and the user picks which one is active. The profile, the assigned branches and the per-role permissions update in real time, so a role change shows up in the interface without a reload.

## Result

The CRM replaced the spreadsheet operation. All the sales data is in a single record, and the system does the consolidation instead of a person.

Management sees the state of the pipeline across every branch without asking anyone for their file. Each executive works on the records that belong to them.

## What I learned

The server authorised an administrative operation with its *guard* and then used the user's restricted token to write it. The database then rejected a write the application had already approved.

The fix was to use the service identity for that write, only after the *guard* had authorised it. Repeating a check across two layers is not waste when each one answers something different, but it requires knowing which answers what.
