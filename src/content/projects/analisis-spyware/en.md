---
slug: analisis-spyware
title: Spyware analysis | Signals and countermeasures
tagline: Lab spyware built to watch the trace it leaves and derive a countermeasure for each indicator.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Security analysis
period:
  start: '2026-03'
  end: '2026-03'
tier: ficha
home: false
visibility: publico
repo: https://github.com/EngelAlexey/spyware
site: null
stack:
  - Python
  - Client-server
  - Malware analysis
cover: null
order: null
---

## Context

An individual exercise in the IT Security I course, the same course that produced the [mass-encryption detector](/en/projects/deteccion-por-umbral). It meant building a tool that reproduces the capture-and-exfiltration cycle, running it in an isolated lab and documenting the trace it leaves.

The exercise asks for countermeasures derived from direct observation, because a list memorised from a manual does not say which of its items works.

## Problem

Anyone defending a system needs to know where to look for the evidence of an attack. An inventory of controls copied from a guide does not say: it lists measures without saying what evidence each attack produces or where it is recorded.

That requires first observing the trace that capture and exfiltration leave when they happen.

## Technical decisions

A client-server tool in Python reproduces the capture-and-exfiltration cycle at small scale. Its only purpose is to generate activity in the lab.

The deliverable is the inventory that this activity produces: outbound traffic, resource access and persistence mechanisms. Each entry carries the control that stops it and the evidence that backs it.

## Architecture

The lab is closed, with no route to the internet, and a snapshot was taken before the exercise. The observed machine and the one receiving the data are on the same isolated segment, so all their traffic can be captured and read.

This setup makes it possible to measure what the tool touches on the filesystem, what it writes to stay active after a reboot and when it opens each connection.

## Result

The inventory is ordered by the point in the system where each control acts: the filesystem, the network and the startup mechanism. Each indicator appears next to the control that stops it and the evidence that backs it, taken from the lab itself.

Every line points to an observation from the lab, so the document can be checked.

## What I learned

The most useful signals came from the filesystem and the persistence mechanism. The network ones helped less, because an encrypted channel hides them.

A network control on its own would not have detected the exercise. Detection came from correlating local access with an outbound connection. A single observation point cannot make that correlation.
