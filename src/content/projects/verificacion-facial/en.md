---
slug: verificacion-facial
title: Face verification | Attendance clock-in
tagline: A service that confirms the person clocking in is the person on file. It compares the photo taken at that moment against the stored face vector, not against another photo.
areas: [ia, seguridad]
kind: profesional
org: Kaizen Apps CR
role: Service redesign and maintenance
period:
  start: '2025-11'
  end: '2026-05'
tier: ficha
home: false
visibility: privado
repo: null
site: null
stack:
  - Python
  - Flask
  - DeepFace
  - OpenCV
  - MySQL
  - Docker
  - Render
cover: null
order: null
---

## Context

Seiri records staff attendance from the phone. For that record to be worth anything, it has to be confirmed that whoever is clocking in is the person the entry belongs to, and not a colleague holding their phone.

This service resolves that confirmation: it receives the photo taken at that moment and returns how close it is to the registered face of that person.

The service already existed and was already in production when I took it over, stood up by another developer on the team. My assignment was to rebuild its internals so it could take daily use, and to maintain it from there.

## Problem

Comparing two people meant downloading both images to temporary files and running a full verification between them. The reference face was reprocessed on every clock-in, every day, without having changed.

Every request also opened its own database connection, with no pool and no retry. A momentary drop left the clock-in with no score.

And the logs were free text. With no request identifier and no elapsed time, a rejected clock-in could not be traced: there was no way to tell whether the download, the detection or the comparison had failed.

## Technical decisions

The person's record already stored their face vector, but the comparison did not use it. A clock-in stopped comparing two images: it now derives the vector from the photo taken at that moment and measures it against the one already stored, by cosine similarity. The work on the reference happens once rather than on every clock-in.

The model is built once and stays in the service's memory, behind a lock so two simultaneous requests do not build it at the same time.

Images are reduced to a maximum dimension before the vector is computed. The cost grows with the size of the image, and the extra pixels do not improve the result.

Connections come from a pool with bounded retries, so a brief drop is not mistaken for a rejection.

Every request carries its own identifier and its logs come out structured, with the stage and the elapsed time. A rejected clock-in can be traced to the exact point where it stopped.

## Architecture

The service receives the image in two ways, depending on where it comes from: by the identifier of a file on Drive, for what already lived there, or embedded in the request, which is the path Seiri uses.

From there the path is the same: face detection, vector computation, comparison against that person's stored vector, and writing the score onto the clock-in row. If the person has no reference vector, the service derives one from their profile photo and stores it, so a first clock-in does not fail on an incomplete record.

The instance that holds the model is suspended and resumed on a schedule, by calling the host's API from two scheduled jobs. A service that loads a model into memory costs the same busy as idle.

## Result

A clock-in returns its score within the same exchange. The reference is computed once per person instead of being reprocessed on every clock-in, and one image travels per request instead of two.

A rejection stopped being an opaque result. With the request identifier it is visible which stage it stopped at and how long each one took, which is what makes it possible to answer an employee who insists they did clock in.

## What I learned

The cost of a service with a model is not in the comparison, it is in everything repeated around it. Downloading two images and reprocessing a reference that had not changed weighed more than the calculation itself.

The underlying lesson is that a derived value which does not change should be stored. A person's reference face is exactly that, and treating it as a file to be read again turned a one-off job into a daily one.
