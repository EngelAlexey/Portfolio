---
slug: guias-scouts
title: Guides and Scouts | Site and enrolment
tagline: A bilingual site with forms and a board portal, built for a team that does not code to maintain.
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional, TCU
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
    caption: "Home page, with the ages, the sections and the method, and enrolment one click away."
  - src: /img/shots/gs-unete.jpg
    alt: "Enrolment page, with the Join the group headline and the three steps of the process"
    caption: "Online enrolment, the process that used to run on paper only."
  - src: /img/shots/gs-secciones-en.jpg
    alt: "The sections page served in English, with the four age stages"
    caption: "The same page in English. Both languages come out of the same content source."
order: null
---

## Context

University community service (TCU), the outreach work the degree requires. The team approached Group 35 of the Guides and Scouts in Esparza, presented the proposal and ran the project under the TCU guidelines.

The team had three people. I took the software architecture, the data model, the security of the personal information and version control. I also built most of the application. My two teammates handled the visual design system and the requirements gathering, which included the accessibility of the content.

Community service ends on a fixed date. From then on, the site is maintained by the group's communications team, who do not code. That condition determined the rest of the decisions.

## Problem

The national Guides and Scouts association has a site of its own, but Group 35 had none. There was nowhere to publish its information or receive an application to join, so becoming known depended on direct contact between acquaintances.

Admissions ran on paper. Whatever arrived through messaging apps was scattered across conversations. An interested family had no way of finding out what the group does, where it meets or how to enrol a child without asking in person.

## Technical decisions

The site has to keep working without the team that built it. If changing a text required editing a component, nobody could update the site after the handover.

So no visible text sits inside a component. All of it is in per-language message catalogues, and the structural data, such as routes, identifiers and section colours, is in a separate file. Components have no hand-written colours either: they all come from CSS custom properties.

The two forms store personal data, and one of them the data of minors. Their tables have row-level security and, on top of that, every grant revoked from the anonymous and authenticated roles. No public policy gives access, so only the server, with its secret key, can read or write. The guardian's consent is a mandatory column with its timestamp, next to the application it authorises.

The board's internal portal has few features on purpose. It shows the applications, lets the board change their state and manages who gets in. It has no roles or permissions, no conversation history and no exports. Deactivating an account is the only control available. Every extra feature would have been code that someone would have to maintain once the team was gone.

The group has no outbound mail of its own, so the portal sends no invitations and no sign-in links by email. Whoever adds a board member sees a temporary password on screen and hands it over by whatever channel the group uses. The password works once, and the portal requires a new one before giving access to the other screens.

## Architecture

The routes of both languages always carry their prefix, and the root redirects to the default language. The switcher strips the prefix from the route and rebuilds it with the other language's prefix. The visitor therefore stays on the same page when switching language.

Submitting the form stores the application and queues a notification. An edge function picks it up and sends the receipt to the applicant. The function claims each notification atomically, so two concurrent runs do not send the same receipt twice.

The portal sits in its own route group, behind a cookie session, and only in Spanish, because it is internal.

## Result

The site is published in Spanish and English, with the group's information, the project catalogue and the two online forms. An interested family finds the group, reads what it does and sends the application without talking to anyone first. The board sees it in its portal and changes its state as it handles it.

The communications team changes any text by editing its catalogue, without opening a component. The handover included documentation and a training session on the catalogues and the portal.

Before publishing, the accessibility check was put in writing:

- the contrast of every section colour;
- a link to skip to the content;
- a visible focus on every interactive element;
- a single top-level heading per page.

## What I learned

Scope was set by what a communications team with no technical background could maintain after the handover. That criterion decided what got built and which features were left out.

The portal exists because the board needed to handle the applications, and it has few features because that team has to be able to maintain it.
