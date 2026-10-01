---
slug: verificacion-facial
title: Face verification | Attendance clock-in
tagline: Confirms that whoever clocks in is the registered person, by comparing the photo taken then with their stored face.
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

[Seiri](/en/projects/seiri-asistencia) records staff attendance from the phone. For that record to be useful, someone has to confirm that whoever clocks in is the person the entry belongs to, and not a colleague holding their phone.

This service makes that confirmation. It receives the photo taken at that moment and returns how close it is to that person's registered face.

When I took it over, the service was already in production. Another developer on the team had built it. My assignment was to rebuild its internals so it could withstand daily use, and to maintain it from there.

## Problem

Every clock-in of the day went through the service, which repeated the whole job on each one. Every comparison meant downloading both images to temporary files and running a full verification between them. The reference face was reprocessed on every clock-in, every day, without having changed.

Every request also opened its own database connection, with no connection pool and no retry. A momentary drop left the clock-in with no score.

The logs were free text, with no request identifier and no elapsed time. A rejected clock-in could not be traced, because there was no way to tell whether the download, the detection or the comparison had failed.

## Technical decisions

The person's record already stored their face vector, but the comparison did not use it. A clock-in now derives the vector from the photo taken at that moment and compares it with the stored one, by cosine similarity. The work on the reference happens once, not on every clock-in.

The model is built once and stays in the service's memory, behind a lock so that two simultaneous requests do not build it at the same time.

Images are reduced to a maximum side length before the vector is calculated. The cost grows with the size of the image, and the extra pixels do not improve the result.

Connections come from a pool with bounded retries, so that a brief drop is not mistaken for a rejection.

Every request carries its own identifier and its logs are structured, with the stage and the elapsed time. A rejected clock-in can be traced to the exact point where it failed.

## Architecture

The service receives the image in two ways, depending on its origin. It can arrive by the identifier of a file on Drive, for the images that were already there, or embedded in the request, which is the path Seiri uses.

From there, the path is the same:

1. face detection;
2. vector calculation;
3. comparison with that person's stored vector;
4. writing the score onto the clock-in row.

The reference vector is calculated when the person is enrolled, so it is already stored by the time they clock in.

The instance that loads the model is suspended and resumed on a schedule, by two scheduled jobs that call the host's API. A service that keeps a model in memory costs the same busy as idle.

## Result

A clock-in gets its score within the same exchange. The reference is calculated once per person, and each request sends one image instead of two.

A rejection stopped being an opaque result. With the request identifier, it is clear which stage it stopped at and how long each one took. With that, it is possible to answer an employee who insists they did clock in.

## What I learned

The cost of a service with a model was in the work repeated around the comparison. Downloading two images and reprocessing a reference that had not changed cost more than the calculation itself.

A derived value that does not change should be stored. A person's reference face is one of those values. Treating it as a file to be read again turned a one-off job into a daily one.
