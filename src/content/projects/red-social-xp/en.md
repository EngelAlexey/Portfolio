---
slug: red-social-xp
title: Student social network | An XP project
tagline: "A project run under Extreme Programming. The product is small on purpose: what gets practised is the process, with pairs, short releases and continuous testing."
areas: [fullstack]
kind: academico
org: Universidad Técnica Nacional
role: Team development
period:
  start: '2026-08'
  end: '2026-08'
tier: ficha
home: false
visibility: publico
repo: https://github.com/Sacariel76/socialMediaProject
site: null
stack:
  - JavaScript
  - HTML
  - CSS
  - LocalStorage
cover: null
shots:
  - src: /img/shots/xp-muro.jpg
    alt: "The social feed with the activity summary, the post form, and posts showing reactions and comments"
    caption: "The feed with the demo backup loaded: summary, tag filters and pagination."
  - src: /img/shots/xp-moderacion.jpg
    alt: "The same feed with the moderation filter active, isolating reported posts"
    caption: "H20. The moderation filter isolates what was reported without hiding it from the feed."
order: null
---

## Context

Agile Software Development Methodologies course. The object of the exercise is not the product but the method: the lecturer hands over a package of user stories for a deliberately simple social feed — post, comment, react, all over LocalStorage — and the team builds it under Extreme Programming.

The project took the last four weeks of the course, from pair assignment to the final demo in front of the class. I worked four stories from the backlog, with the log and the tests each one requires.

## Problem

A team with no defined method integrates at the end, discovers the conflicts when there is no time left, and cannot say what is finished. The exercise is built so that does not happen: it puts the process ahead of the code and keeps the product simple enough that none of those failures can hide behind technical complexity.

The rules are the real constraint. One story at a time per pair. Driver and navigator rotating every twenty-five minutes. A board with Pending, In development, In testing and Done. Tests recorded before review is requested, and a working version saved after each accepted story. And a definition of Done that admits no shades: if it almost works, it stays in development.

## Technical decisions

Each story was worked on its own branch and came in through a pull request, merged by someone else. That makes half-finished work visible: a branch open too long is a story that is not moving, and the board shows it before anyone has to ask.

Tests are recorded before review is requested, not after merging, and refactoring is continuous rather than a task of its own. Each session closes on a stable version, not on a half-finished branch.

On the code side, the decision that shaped the rest was about compatibility. Posts already saved in the browser carried a like counter that two previously delivered stories depend on, so the new three-reaction model migrates on read and keeps the old counter in sync. Neither of those stories had to be touched, which is the only way to satisfy the rule about not breaking earlier work without stopping whoever wrote it.

## Architecture

Three JavaScript files with no dependencies: the entry point, the module that renders posts, and the storage module, the only one that touches LocalStorage. Every read passes through normalisation, which is what lets a post saved by an earlier version still open.

The simplicity is intentional. With no dependencies and no build, anyone on the team opens the project and tests it in the browser on the spot, which is the condition for pairs to rotate every twenty-five minutes.

## Result

The system closed with the twenty stories in the package integrated and demonstrated to the class. The four I worked were accepted with their criteria verified, and the regression suite over the earlier ones passed without failures.

The real deliverable is the record. Each story ends up with its evidence, its test and the errors that came up along the way, which is what makes it possible to review the process and not only the product.

## What I learned

I learned to use Extreme Programming by applying it rather than reading about it: pair programming with rotation, short releases, continuous refactoring and frequent integration, with tests recorded before review is requested.

Practising it is what shows where the method bites. The definition of Done is uncomfortable in the moment, and it is exactly what stops a session closing with four half-finished stories instead of two complete ones.
