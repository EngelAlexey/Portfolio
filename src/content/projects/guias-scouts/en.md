---
slug: guias-scouts
title: Guides and Scouts | Site and signups
tagline: Group information and a signup form with an email receipt, in two languages, built to be kept up by people who do not code.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional — TCU
role: Development
period:
  start: '2026-05'
  end: '2026-08'
tier: ficha
home: false
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
order: null
---

## Context

University community service, the outreach requirement the degree carries. The team approached Group 35 of the Guides and Scouts, presented the proposal, and ran the project under the programme's terms.

The scope was to open up the group's digital presence: its public site and its social channels. The site carries the group's information and a joining form, in Spanish and English. That was my part.

The condition that shaped the project is its ending. Community service finishes on a fixed date, and from then on the site is in the hands of the group's communications team, who do not write code.

## Problem

The national Guides and Scouts association has its own site; Group 35 had none. Locally there was nowhere to publish its information or receive a joining request, so getting known depended on direct contact and on somebody knowing somebody.

An interested family had no way to find out what the group does, where it meets, or how to enrol a child without asking in person.

## Technical decisions

The site has to stay alive without the team that built it. Any text change that required editing a component would have frozen it on handover day.

So no visible text lives inside a component. All of it sits in per-language message catalogues, with the structural data, such as routes, identifiers and section colours, in a separate file. There are no loose colours inside components either: they all come from CSS custom properties.

The admin panel was deliberately left out of scope. It would have added authentication, roles and an interface to maintain, for a group with nobody to repair it.

## Architecture

Both routes always carry a language prefix, and the root redirects to the default language. The switcher takes the route without its prefix and rebuilds it under the other language, so switching language leaves the visitor on the same page.

Submitting the form writes the request and queues a notification. An edge function picks it up and sends the confirmation to the applicant.

## Result

The site is published in Spanish and English, with the group's information and the joining form online. An interested family finds the group, reads what it does and sends the request without speaking to anyone first.

The communications team changes any text by editing its catalogue, without opening a component. Documentation and a training session on those catalogues were handed over with it.

The edge function claims each notification atomically, so two simultaneous runs do not send the same confirmation twice. Tables holding personal data have row-level security and are not exposed to public roles.

## What I learned

Leaving out the admin panel has a real cost: any change that is not text still needs a deployment, and that needs someone technical.

It was still the right decision for this client. Scope was not set by what the site could do, but by what a communications team with no technical background could keep running after handover.
