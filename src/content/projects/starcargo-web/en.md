---
slug: starcargo-web
title: Corporate website
tagline: A full redesign in four languages. Each section declares a tone and components read the variables in force.
areas: [fullstack]
kind: profesional
org: Star Cargo Service
role: Development
period:
  start: '2026-05'
  end: null
tier: ficha
home: false
visibility: privado
repo: null
site: https://www.starcargoservice.com
stack:
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - MySQL
  - Google Cloud Run
  - Playwright
cover: null
order: null
---

## Context

Star Cargo moves sea, air and road freight across six Central American countries. Importers use the site to request a quote, check consolidation corridors, or find the office that covers them.

The site is published in Spanish, English, Chinese and Hindi, because a large share of the shipments come from those markets.

## Problem

The brief was a rebrand and a modernisation of the site, not a retouch of the previous one.

Star Cargo sells into markets that do not share a language, and the site is where an importer asks for a quote before speaking to anyone. It has to serve Spanish, English, Chinese and Hindi with the same content and the same structure in all four.

## Technical decisions

The previous site worked, so the immediate option was to edit on top of it, inheriting its build, its dependencies and its earlier decisions. The result would have been the same site under a different layer of styles.

A separate project from day one: its own build, its own dependencies, no shared configuration. A date was fixed after which it stopped taking code from the previous site.

The backend started as a copy and is now this project's own code: it is edited here and nowhere else. Without that date there would have been two partially merged projects with no authoritative source.

## Architecture

The visual system is a dark theme on a rounded canvas. Each section declares a tone: dark, navy or paper. That tone redefines a set of CSS variables for surface, line, text and action.

Components are not given the tone as a property and do not query it. They read whichever variables are in force at the point where they are drawn. The same button in a light section and in a dark one is the same component, with no conditionals.

## Result

The set of checks is defined once and runs at two moments: when a change is merged, and when it is deployed to production.

It verifies types and tests, plus a warning ceiling that cannot rise without justifying it in the commit. It also checks that the four languages hold exactly the same translation keys and that the content security policy is still active. Deployment ends with a smoke test against the published site.

## What I learned

While the new project kept inheriting code from the old one, every improvement had to be applied twice and every divergence looked like a sync error.

Fixing a cut-off date removed that ambiguity. From then on the previous site stopped being a source of changes and became only a reference.
