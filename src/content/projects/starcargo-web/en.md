---
slug: starcargo-web
title: Star Cargo site | Online requests and client portal
tagline: Eight online applications feed a signed-in portal where clients follow their submissions and the team works them, with permission resolved against the ERP.
areas: [fullstack]
kind: profesional
org: Star Cargo Service
role: Development
period:
  start: '2026-05'
  end: null
tier: ficha
home: true
visibility: privado
repo: null
site: https://www.starcargoservice.com
stack:
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - Auth.js
  - MySQL
  - Google Cloud Run
  - Playwright
cover: null
order: 3
---

## Context

Star Cargo moves sea, air and road freight across six Central American countries. Importers use the site to request a quote, check consolidation routes, or find the office that covers them.

The site is published in Spanish, English, Chinese and Hindi, because a large share of the shipments come from those markets.

The site does not end at the form. What gets sent lands in a signed-in portal: the client follows their submissions and opens their attachments, and the team receives them sorted by type, alongside clients, incidents and candidacies.

## Problem

The brief was a rebrand and a modernisation of the site, not a retouch of the previous one.

Star Cargo sells into markets that do not share a language, and the site is where an importer asks for a quote before speaking to anyone. It has to serve Spanish, English, Chinese and Hindi with the same content and the same structure in all four.

On the previous site the applications hung from a dropdown with no page of its own, were absent from the footer, and three had no other link anywhere. Its portal returned 404 in production, so a submitted application could not be looked up afterwards.

## Technical decisions

The previous site worked, so the immediate option was to edit on top of it, inheriting its build, its dependencies and its earlier decisions. The result would have been the same site under a different layer of styles.

A separate project from day one: its own build, its own dependencies, no shared configuration. A date was fixed after which it stopped taking code from the previous site.

The backend started as a copy and is now this project's own code: it is edited here and nowhere else. Without that date there would have been two partially merged projects with no authoritative source.

## Architecture

The visual system is a dark theme on a rounded canvas. Each section declares a tone: dark, navy or paper. That tone redefines a set of CSS variables for surface, line, text and action.

Components are not given the tone as a property and do not query it. They read whichever variables are in force at the point where they are drawn. The same button in a light section and in a dark one is the same component, with no conditionals.

The portal splits fourteen screens between two audiences: six for the client and eight for the team. The menu is not written by hand. Every entry is filtered by audience and by permission, so an option without a grant is never drawn.

Permissions do not live in this project. They are resolved against the ERP on every request and the repository holds no permission table at all. An account with no grants signs in and sees nothing. The branch selector changes what the same account sees, and without the personal-data permission a file comes back with those fields hidden and its documents of that class are not served.

Attachments open inside the gate: the token is checked against the file, the applicant against ownership, and the document against its folder. A client opens their own without leaving for external storage.

## Result

The site is in production in all four languages, with the same structure and the same content in each.

The eight applications submit against the ERP and clients use the portal. Employees sign in with Google, gated on the signed domain claim rather than on the email string; clients sign in through an invitation from an employee.

The set of checks is defined once and runs at two moments, when a change is merged and when it is deployed. It verifies types, tests and a warning ceiling that cannot rise without justifying it in the commit; that the four languages hold exactly the same translation keys; and that the content security policy is still active. Deployment ends with a smoke test against the published site.

## What I learned

Inheriting code from the old site meant applying every improvement twice, and any divergence between the two looked like a sync error rather than a decision. The cut-off date removed that ambiguity: from then on the previous site is a reference, not a source of changes.
