---
slug: red-social-xp
title: Student social network | An XP project
tagline: "The product is small on purpose to practise the method: pair programming, short releases and continuous testing."
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

A project for the Agile Software Development Methodologies course. The exercise assesses the working method more than the product.

The lecturer hands over a package of user stories for a minimal social network, simple on purpose: post, comment and react, all over LocalStorage. The team builds it under Extreme Programming.

The project took the last four weeks of the course, from pair assignment to the final demonstration in front of the class. I worked on four stories from the backlog, with the log and the tests each one requires.

## Problem

A team with no defined method integrates its work at the end, discovers the conflicts when there is no time left and cannot say what is finished.

The exercise is designed to prevent that. It puts the process ahead of the code and keeps the product so simple that those failures cannot be blamed on technical complexity.

The rules of the method are the real constraint:

- each pair works on a single story at a time;
- the driver and the navigator rotate every twenty-five minutes;
- a board shows the Pending, In development, In testing and Done columns;
- tests are recorded before review is requested;
- a working version is saved after each accepted story;
- a story that almost works stays In development, because the definition of Done is strict.

## Technical decisions

Each story was worked on its own branch and came in through a pull request, merged by another team member. That makes half-finished work visible. A branch open too long is a story that is not moving, and the board shows it before anyone asks.

Refactoring is continuous, not a separate task. Each session ends on a stable version, not on a half-finished branch.

On the code side, the decision that shaped the rest was about compatibility. Posts already saved in the browser carried a like counter that two previously delivered stories depend on. The new three-reaction model therefore migrates the data on read and keeps the old counter in sync. Neither of those two stories had to change, so the rule against breaking earlier work was met without stopping whoever wrote them.

## Architecture

There are three JavaScript files with no dependencies: the entry point, the module that renders posts and the storage module, the only one that touches LocalStorage. Every read passes through normalisation, which is why a post saved by an earlier version still opens.

The simplicity is intentional. With no dependencies and no build step, anyone on the team opens the project and tests it in the browser on the spot. Without that, pairs could not rotate every twenty-five minutes.

## Result

The system closed with the twenty stories in the package integrated and demonstrated to the class. The four I worked on were accepted with their criteria verified, and the regression run over the earlier ones passed without failures.

The log is the main deliverable. Each story ends up with its evidence, its test and the errors that came up, so the process can be reviewed as well as the product.

## What I learned

I learned Extreme Programming by applying it: pair programming with rotation, short releases, continuous refactoring and frequent integration.

Practice shows where the method is hard. The definition of Done is uncomfortable in the moment, but it prevents closing a session with four half-finished stories instead of two complete ones.
