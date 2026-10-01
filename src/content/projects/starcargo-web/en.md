---
slug: starcargo-web
title: Star Cargo Service platform | Requests and case files
tagline: Eight online requests that end up in a portal where clients follow their submissions and the team handles them.
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
shots:
  - src: /img/shots/sc-antes-home.jpg
    alt: "Home page of the previous site, with a full-screen photograph of a lorry"
    caption: "Home, before. Four entries in the menu, with the service requests hidden in a dropdown."
  - src: /img/shots/sc-despues-home.jpg
    alt: "Home page of the current platform, with the headline beside a globe and the next consolidation cut-off"
    caption: "Home, after. Quoting, tracking and the next consolidation cut-off in plain sight."
  - src: /img/shots/sc-antes-nosotros.jpg
    alt: "About page on the previous site, with an office photograph and the headline Quality logistics"
    caption: "About, before. A stock photograph and a headline carrying no figures."
  - src: /img/shots/sc-despues-nosotros.jpg
    alt: "Current About page, with the headline and four figures: countries, hubs, services and departures"
    caption: "About, after. Countries, hubs, services and departure frequency as figures."
  - src: /img/shots/sc-antes-sucursales.jpg
    alt: "Branches page on the previous site, with Costa Rica opening hours and phone under a photograph"
    caption: "Branches, before. A list of offices, with no way to write from the page."
  - src: /img/shots/sc-despues-contacto.jpg
    alt: "Current contact page, with direct channels on the left and a message form on the right"
    caption: "Contact, after. Direct channels beside a form that lands in the portal."
  - src: /img/shots/sc-antes-rastreo.jpg
    alt: "Tracking screen on the previous site, with a search form and an empty result panel"
    caption: "Tracking, before. It asked for an optional token and did not say what it returned."
  - src: /img/shots/sc-despues-rastreo.jpg
    alt: "Current tracking screen, with the bill of lading field and an explanation of what the query returns"
    caption: "Tracking, after. The expected format and what the query returns, before you type."
  - src: /img/shots/sc-antes-credito.jpg
    alt: "Credit application form on the previous site, with four steps and applicant fields"
    caption: "Credit application, before. The form opened straight away, with no idea of scope or time."
  - src: /img/shots/sc-despues-credito.jpg
    alt: "Current credit application page, with steps, attachments, duration, delivery format and what to have at hand"
    caption: "Credit application, after. Steps, attachments, duration and what to have at hand first."
  - src: /img/shots/sc-antes-aduanas.jpg
    alt: "Tariff-heading form on the previous site, with commercial invoice and bill of lading upload"
    caption: "Tariff headings, before."
  - src: /img/shots/sc-despues-aduanas.jpg
    alt: "Current tariff-heading page, with steps, attachments, duration and delivery format"
    caption: "Tariff headings, after. Every request declares what it produces and in what format."
  - src: /img/shots/sc-antes-diligencia.jpg
    alt: "Due diligence form on the previous site, with six steps and document upload"
    caption: "Due diligence, before. On this page the logo did not even render."
  - src: /img/shots/sc-despues-diligencia.jpg
    alt: "Current due diligence page, with steps, attachments, duration and the documents required"
    caption: "Due diligence, after. The documents the regulation requires, listed before you start."
  - src: /img/shots/sc-antes-reexportacion.jpg
    alt: "Re-export certificate form on the previous site, with commercial invoice upload"
    caption: "Re-export certificate, before."
  - src: /img/shots/sc-despues-reexportacion.jpg
    alt: "Current re-export certificate page, with steps, attachments, duration and XLSX delivery"
    caption: "Re-export certificate, after."
  - src: /img/shots/sc-antes-empleo.jpg
    alt: "Job application form on the previous site, with CV upload across four steps"
    caption: "Job application, before."
  - src: /img/shots/sc-despues-empleo.jpg
    alt: "Current Work with us page, with steps, attachments, duration and the details requested"
    caption: "Job application, after. It now says plainly this is a talent pool, not a specific vacancy."
  - src: /img/shots/sc-antes-instalacion.jpg
    alt: "Android app download page on the previous site, with the Star Truck spec sheet"
    caption: "App download, before."
  - src: /img/shots/sc-despues-instalacion.jpg
    alt: "Current Android applications page, with platform, number of apps, size and origin"
    caption: "App download, after."
  - src: /img/shots/sc-tramites.jpg
    alt: "Index of the site's service requests, showing how many there are, which run online and whether they need an account"
    caption: "The service-request index the old site never had: how many there are, which need an account."
  - src: /img/shots/sc-reserva.jpg
    alt: "Warehouse booking page, with steps, attachments, duration and the receipt delivered by email"
    caption: "Warehouse booking. A new request with no equivalent on the previous site."
  - src: /img/shots/sc-ayuda.jpg
    alt: "Help page, with request types, complaint acknowledgement, response time and reference number"
    caption: "Help. Also new: a request is recorded with a category, a priority and a reference number."
  - src: /img/shots/sc-servicios.jpg
    alt: "Services page, with the catalogue split into move, clear customs, and store and deliver"
    caption: "Services, organised by the cargo cycle rather than as a list."
  - src: /img/shots/sc-rutas.jpg
    alt: "Main routes page, with countries, consolidation hubs, modes and destinations"
    caption: "Routes. Consolidation hubs, modes and destinations."
  - src: /img/shots/sc-itinerarios.jpg
    alt: "Departure itineraries page, with departures per month, hubs, countries and modes"
    caption: "Itineraries. The next departures, filterable by mode."
  - src: /img/shots/sc-chino.jpg
    alt: "The same home page served in Chinese, with the navigation and the next cut-off translated"
    caption: "The home page in Chinese. All four languages share structure and content."
order: 3
---

## Context

Star Cargo Service moves sea, air and land freight between six countries in Central America. Its site is the first commercial point of contact. An importer arrives there to request a quote, to check the consolidation corridors or to find the office that covers them.

The brief was a rebrand and a new platform, not a touch-up of the old site. The company sells into markets that do not share a language. It also needed whatever the site collects to end up in a case file the client can follow, not in an inbox.

## Problem

On the old site, the service requests sat in a dropdown with no page of their own and did not appear in the footer. Three of them had no other link at all. An importer arriving from a search engine could not find how to request a quote.

Its portal returned 404 in production. A submitted request could not be looked up afterwards, by the client or by the team, so follow-up fell back to email and the phone.

Language was the other limit. A large share of shipments comes from markets that do not speak Spanish, and the site only served one of them well.

## Technical decisions

The old site worked, so the immediate option was to edit on top of it and inherit its build, its dependencies and its earlier decisions. The result would have been the same site under another layer of styling.

A separate project was opened from day one, with its own build and dependencies and no shared configuration. A date was set after which the new project stopped taking code from the old site.

The backend started as a copy and is now this project's code, edited here and nowhere else. Without that date there would be two half-merged projects and no single source of reference.

Permissions are not stored in this project. They are resolved against the ERP on every request, because copying them here would have meant keeping a second copy in sync with the ERP.

## Architecture

The public site serves all four languages with the same structure and the same content. Each section declares a visual tone, and components read the variables in force where they are drawn. The same button therefore works in a light section and a dark one, with no conditionals.

The site's eight service requests are sent to the ERP and land in a portal behind a session. The portal has fourteen screens for two audiences. Six are for the client, who follows their requests and opens their attachments. The other eight are for the team, who receive the requests sorted by type alongside clients, incidents and job applications.

The menu is not written by hand. Every entry is filtered by audience and by permission, so an option without permission is never drawn. An account with no permissions signs in and sees nothing.

Attachments open inside access control: the token is checked against the case file, the requester against ownership and the document against its folder. Clients open their own without leaving for external storage.

## Result

The site is in production in Spanish, English, Chinese and Hindi. Clients follow their requests in the portal, without calling or writing to ask where they stand.

Employees sign in with Google, and the check is made on the token's signed domain, not on the text of the address. Clients enter by invitation from an employee.

The set of checks is defined once and runs at two points: when a change is merged and when it is deployed. It checks:

- the types and the tests;
- a warning ceiling that cannot rise without a justification in the commit;
- that all four languages have exactly the same translation keys;
- that the content security policy is still active.

Deployment ends with a smoke test against the published site.

## What I learned

Inheriting code from the old site meant applying every improvement twice. On top of that, any difference between the two looked like a sync error rather than a decision.

The cut-off date removed that ambiguity, because from that day the old site is a reference and not a source of changes. In a migration it is worth setting that date early, before there are two versions of the same fix to reconcile.
