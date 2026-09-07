---
slug: starcargo-web
title: Star Cargo Service platform | Requests and case files
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

Star Cargo Service moves sea, air and land freight between six countries in Central America. Its site is the first commercial point of contact: an importer arrives there to request a quote, to check consolidation corridors, or to find the office that covers them.

The brief was a rebrand and a new platform, not a touch-up of the old site. The company sells into markets that do not share a language, and it also needed what the site collects to end up in a case file the client can follow, rather than in an inbox.

## Problem

The old site led nowhere. The services hung off a dropdown with no page of their own, did not appear in the footer, and three had no other link at all. An importer arriving from a search engine could not find how to request a quote.

Its portal returned 404 in production. A submitted request could not be looked up afterwards, by the client or by the team, and follow-up fell back to email and the phone.

Language was the other limit. A large share of shipments comes from markets that do not speak Spanish, and the site served only one of them well.

## Technical decisions

The old site worked, so the immediate option was to edit on top of it and inherit its build, its dependencies and its earlier decisions. The result would have been the same site under another layer of styling.

A separate project was opened on day one: its own build, its own dependencies, no shared configuration. A date was fixed after which it stopped taking code from the old site.

The backend started as a copy and is now this project's code: it is edited here and nowhere else. Without that date there would be two partially merged projects and no authoritative source.

Permissions are not stored in this project. They are resolved against the ERP on every request, because copying them here would have created a second truth to keep in sync with the first.

## Architecture

The public site serves all four languages with the same structure and the same content. Each section declares a visual tone, and components read the variables in force where they are drawn. The same button works in a light section and a dark one, with no conditionals.

The site's eight service requests submit against the ERP and land in a portal behind a session. The portal splits fourteen screens between two audiences: six for the client, who follows their requests and opens their attachments, and eight for the team, who receive them sorted by type alongside clients, incidents and job applications.

The menu is not written by hand. Every entry is filtered by audience and by permission, so an option without permission is never drawn. An account with no permissions signs in and sees nothing.

Attachments open inside access control: the token is checked against the case file, the requester against ownership, and the document against its folder. Clients open their own without leaving for external storage.

## Result

The site is in production in Spanish, English, Chinese and Hindi, with the same structure and the same content in all four. The eight service requests submit against the ERP and clients follow their requests in the portal, without calling or writing to ask where they stand.

Employees sign in with Google, with the check placed on the token's signed domain rather than on the text of the address. Clients enter by invitation from an employee.

The verification set is defined once and runs at two moments, when a change is merged and when it is deployed. It checks types and tests, a warning ceiling that cannot rise without a justification in the commit, that all four languages carry exactly the same translation keys, and that the content security policy is still active. Deployment ends with a smoke test against the published site.

## What I learned

Inheriting code from the old site meant applying every improvement twice, and any divergence between the two looked like a sync error rather than a decision.

The cut-off date removed that ambiguity: from then on the old site is a reference and not a source of changes. In a migration it is worth fixing that date early, while there are not yet two versions of the same fix to reconcile.
