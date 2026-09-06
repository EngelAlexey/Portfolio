---
slug: guias-scouts
title: Guides and Scouts | Group 35 site
tagline: A membership form and email confirmation, in two languages, built to be maintained by people who do not code.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional — TCU
role: Development
period:
  start: '2026-05'
  end: '2026-08'
tier: ficha
home: true
visibility: publico
repo: https://github.com/EngelAlexey/Guias-Scout
site: null
stack:
  - Next.js
  - React
  - TypeScript
  - Supabase
  - PostgreSQL
  - Resend
  - Vercel
cover: null
order: 4
---

## Context

University community service, the community-service requirement the degree carries. The team approached Group 35 of the Guides and Scouts, put the proposal to them, and ran the project under the programme's guidelines.

The scope was to open up the local group's digital presence: its public site and its social channels. The site carries the group's information and a membership form, in Spanish and English. That was my part.

## Problem

The national Guides and Scouts association has a site of its own; Group 35 did not. Locally there was nowhere to publish their information or receive a membership request, so being found depended on direct contact.

The project has an end date and the site does not. When the placement closes, the people maintaining it are the group's communications team, who do not code.

Any text change that required editing a component would have frozen the site the day the university team left.

## Technical decisions

No visible text lives inside a component. All of it sits in per-language message catalogues, with structural data (routes, identifiers, section colours) in a separate file.

Changing a sentence means editing one line of JSON. Adding a language means copying a catalogue.

There are no loose colours inside components either: all of them come from CSS custom properties.

## Architecture

Both routes always carry a language prefix, and the root redirects to the default language. The switcher takes the path without its prefix and rebuilds it under the other language, so changing language leaves the visitor on the same page.

Submitting the form writes the request and queues a notification. An edge function claims it and sends the confirmation.

## Result

That edge function is the most carefully written part. It validates the webhook secret with a constant-time comparison. It claims the notification atomically before sending anything, and retries with growing backoff up to a ceiling.

The atomic claim is what stops two simultaneous runs sending the same confirmation twice.

Tables holding personal data have row-level security and are not exposed to public roles.

## What I learned

The admin panel was left out of scope deliberately. It would have added authentication, roles and an interface to maintain, for a group with nobody to repair it.

Documentation and a training session on the message catalogues were delivered instead. That decision has a real cost: any change beyond text still needs a deployment.
