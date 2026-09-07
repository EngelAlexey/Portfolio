---
slug: guias-scouts
title: Guides and Scouts | Site and enrolment
tagline: The group's site in two languages, two forms that replace the paper slip, and an internal portal for the board, built so that people who do not code can keep it running.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional — TCU
role: Architecture and development
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
shots:
  - src: /img/shots/gs-portada.jpg
    alt: "Home page of the Group 35 site, with the headline, the programme figures and the enrolment button"
    caption: "Home. Ages, sections and method, with enrolment one click away."
  - src: /img/shots/gs-unete.jpg
    alt: "Enrolment page, with the Join the group headline and the three steps of the process"
    caption: "Online enrolment, the process that used to run on paper only."
  - src: /img/shots/gs-secciones-en.jpg
    alt: "The sections page served in English, with the four age stages"
    caption: "The same page in English. Both languages come out of the same content source."
order: null
---

## Context

University community service, the outreach requirement of the degree. The team approached Group 35 of the Guides and Scouts in Esparza, put the proposal to them and ran the project under the programme's rules.

There were three of us. I took the software architecture, the data model, the security of the personal information and version control, and built most of the application; the visual design system, and the requirements work with content accessibility, belonged to my two teammates.

The condition that shaped the project is its ending. Community service finishes on a fixed date, and from then on the site is in the hands of the group's communications team, who do not code.

## Problem

The national Guides and Scouts association has a site of its own; Group 35 had none. Locally there was nowhere to publish their information or receive an application, so becoming known depended on direct contact and on somebody knowing somebody.

Admissions ran on paper, and whatever arrived through messaging apps scattered across conversations. An interested family had no way of finding out what the group does, where it meets or how to enrol a child without asking in person.

## Technical decisions

The site has to stay alive without the team that built it. Any text change that required editing a component would have frozen it on handover day.

So no visible text lives inside a component. It is all in per-language message catalogues, and the structural data — routes, identifiers and section colours — sits in a separate file. Nor are there loose colours inside components: they all come from CSS custom properties.

The two forms store personal data, and one of them the data of minors. Their tables carry row-level security and, on top of that, every grant revoked from the anonymous and authenticated roles: there is no public policy to grant, so only the server with its secret key can write or read. The guardian's consent is not a checkbox in the interface but a mandatory column with its timestamp, next to the application it authorises.

The board's internal portal is deliberately thin. It shows the applications, lets their state change and administers who gets in; it has no roles or permissions, no conversation history, no exports. Deactivating an account is the only control available. Every extra feature would have been surface that somebody has to repair once we are gone.

The group has no outbound mail of its own, so the portal sends neither invitations nor magic links: whoever adds a board member sees a temporary password on screen and hands it over by whatever channel the group uses. That password works once, and the portal makes them choose their own before letting them reach any other screen.

## Architecture

Both routes always carry a language prefix, and the root redirects to the default language. The switcher takes the route without its prefix and rebuilds it under the other language, so changing language leaves the visitor on the same page.

Submitting the form writes the application and queues a notification. An edge function picks it up and sends the receipt to the applicant.

The portal lives in its own route group, behind a cookie session, and only in Spanish: it is internal.

## Result

The site is published in Spanish and English, with the group's information, the project catalogue and the two online forms. An interested family finds the group, reads what it does and sends the application without talking to anyone first; the board sees it in their portal and moves its state as they handle it.

The communications team changes any text by editing its catalogue, without opening a component. Documentation and a training session were delivered on those catalogues and on the portal.

Before publishing, the accessibility verification was put in writing: the contrast of every section colour, a skip link to the content, a visible focus ring on every interactive element and a single top-level heading per page.

The edge function claims each notification atomically, so two concurrent runs do not send the same receipt twice.

## What I learned

Scope was not set by what the site could do, but by what a communications team with no technical background could sustain after the handover. That rule decided both what got built and what was left out inside what got built: the portal exists because it was needed, and it is short for the same reason it exists.
