---
slug: veterinaria-scrum
title: Veterinary clinic | A Scrum project
tagline: "A project run under Scrum. The product is small on purpose: what gets practised is the framework, with a prioritised backlog, rotating roles, sprints and a review at each close."
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Team development
period:
  start: '2026-06'
  end: '2026-07'
tier: ficha
home: false
visibility: publico
repo: https://github.com/SebastianRodMes/veterinaria-scrum
site: null
stack:
  - JavaScript
  - HTML
  - CSS
  - LocalStorage
cover: null
shots:
  - src: /img/shots/vet-cliente.jpg
    alt: "Client view with the available slots per day and the appointment details form"
    caption: "Client view. Free, selected and taken slots, with the booking summary."
  - src: /img/shots/vet-cuenta.jpg
    alt: "Client sign-in screen, with sign-in and create-account tabs"
    caption: "Sign-in with two roles. The role decides which view the session lands on."
  - src: /img/shots/vet-admin.jpg
    alt: "Administration panel with the appointment queue ordered by date and time, per-state counters and the confirm button"
    caption: "Administrator panel. The FIFO queue, the per-state counters and the confirm action."
order: null
---

## Context

Agile Software Development Methodologies course, the same team working under Scrum this time. As in the Extreme Programming project, the product is small on purpose: what gets practised is the framework — Product Owner, Scrum Master and developers, a prioritised backlog, sprints with planning, review and retrospective.

The case is a veterinary clinic that books consultations. My contribution was four stories, plus carrying the handed-over design onto the project architecture.

## Problem

Ten stories, three priority levels, and a window that does not fit them all. The exercise forces a choice and forces that choice to be written down: the priority-one stories are delivered complete before anything else is touched, and whatever does not fit stays in the backlog with its priority rather than vanishing from scope.

On the domain side, what had to be resolved is the life of a consultation. A booked appointment is not a confirmed appointment, and the client needs to know which of the two they have before turning up with their pet.

## Technical decisions

Roles were reassigned halfway through the project rather than fixed at the start. Rotating who holds the backlog and who facilitates forces everyone to understand both sides, and it is exactly the part of the framework that is lost when a team divides the parts once and leaves them there.

Each story was worked on its own branch and came in through a pull request, merged by someone else. Work in progress was capped on the board, so a bottleneck shows up in the column where it piles up rather than at the sprint review.

The domain glossary was written before the code and lives in the repository. It is what stops a consultation meaning one thing in the story and another in the implementation.

On the product side, the decision that holds up the rest is modelling a consultation as a state machine — pending, confirmed, in progress, completed, cancelled — with the transitions declared in one place. Confirming stops being a tick box: the administrator assigns a date and time, the consultation changes state, and the client gets the notice carrying those details.

## Architecture

A static site with no dependencies. The CSS goes in layers — base, structure, components and per-view styles — and the JavaScript separates a utility library covering storage, DOM, routing and validation from the domain modules: consultations, pets, schedules, notifications and session.

Registration distinguishes client from administrator to decide which view the session lands on, resolved in the browser over LocalStorage: it separates the two views of the exercise, it protects nothing.

The tests are per-module specification pages, opened in the browser to run their cases.

## Result

A client books their pet's consultation from the available slots, and the administrator sees it on their panel, assigns a date and time and confirms it. The priority-one stories were delivered, and several priority-two ones with them.

Whatever did not fit stayed in the backlog with its priority, rather than being dropped from scope. The final delivery was validated story by story against the definition of Done.

## What I learned

I learned to use Scrum by practising it: the Product Owner, Scrum Master and developer roles, the prioritised backlog, sprint planning and the daily meeting, the increment review and the retrospective at the close.

Practising it is what teaches what each piece is for. A prioritised backlog is above all a way of deciding what does not get done, and that only lands once the window falls short and what stays out has to be written down.
