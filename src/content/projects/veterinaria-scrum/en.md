---
slug: veterinaria-scrum
title: Veterinary clinic | A Scrum project
tagline: "The product is small on purpose to practise Scrum: a prioritised backlog, rotating roles, sprints and a closing review."
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

A project for the Agile Software Development Methodologies course, done by the same team, this time under Scrum. As in the [Extreme Programming project](/en/projects/red-social-xp), the product is small on purpose so the framework can be practised. That framework includes the Product Owner, Scrum Master and developer roles, the prioritised backlog and sprints with planning, review and retrospective.

The case is a veterinary clinic that books consultations. My contribution was four stories, plus carrying the handed-over design onto the project architecture.

## Problem

The backlog had ten stories with three priority levels, and there was not enough time for all of them. The exercise forces a choice and requires that choice to be written down. The priority-one stories are delivered complete before anything else is touched, and whatever does not fit stays in the backlog with its priority.

On the domain side, the life cycle of a consultation had to be resolved. A booked appointment is not a confirmed appointment, and the client needs to know which of the two they have before turning up with their pet.

## Technical decisions

Roles were reassigned halfway through the project instead of being fixed at the start. Rotating who holds the backlog and who facilitates forces everyone to understand both sides. That part of the framework is lost when a team hands out the roles only once.

Each story was worked on its own branch and came in through a pull request, merged by another team member. The board caps work in progress, so that a bottleneck shows up in the column where work piles up and not at the sprint review.

The domain glossary was written before the code and is kept in the repository. That way, "consultation" means the same thing in the story and in the implementation.

On the product side, the central decision was to model a consultation as a state machine, with the transitions declared in one place. The states are pending, confirmed, in progress, completed and cancelled. Confirming stops being a tick box: the administrator assigns a date and time, the consultation changes state and the client gets the notice with those details.

## Architecture

It is a static site with no dependencies. The CSS is organised in layers: base, structure, components and per-view styles. The JavaScript separates a utility library, which covers storage, DOM, routing and validation, from the domain modules: consultations, pets, schedules, notifications and session.

Registration distinguishes the client from the administrator to decide which view the session opens. It is resolved in the browser over LocalStorage, so it only separates the two views of the exercise and protects nothing.

The tests are per-module specification pages, which open in the browser and run their cases.

## Result

A client books their pet's consultation by choosing from the available slots. The administrator sees it on their panel, assigns a date and time and confirms it.

The priority-one stories were delivered, and several priority-two ones with them. The final delivery was validated story by story against the definition of Done.

## What I learned

I learned Scrum by practising it, from sprint planning and the daily meeting to the increment review and the retrospective.

Practice shows what each piece is for. A prioritised backlog is above all a way of deciding what the team will not build. That only becomes clear when time runs short and what stays out has to be written down.
