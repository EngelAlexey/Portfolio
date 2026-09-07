---
slug: analisis-spyware
title: Spyware analysis | Signals and countermeasures
tagline: The spyware is built so it can be watched in an isolated lab, and the countermeasures come out of that trace, each one next to the indicator that triggers it.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Security analysis
period:
  start: '2026'
  end: '2026'
tier: ficha
home: false
visibility: publico
repo: null
site: null
stack:
  - Python
  - Client-server
  - Malware analysis
cover: null
order: null
---

## Context

An IT Security I course, the same one the [mass-encryption detector](/en/projects/deteccion-por-umbral) came out of. An individual exercise: build a tool that reproduces the capture-and-exfiltration cycle, run it inside an isolated lab, and document the trace it leaves.

The point of the exercise is to derive the countermeasures from direct observation rather than from a manual, because a memorised list does not tell you which of its items works.

## Problem

Whoever defends a system needs to know where to look. An inventory of controls copied from a guide does not answer that: it lists measures without saying what evidence each attack produces or where that evidence is recorded.

To know what to watch, you first have to see what trace capture and exfiltration leave when they actually happen.

## Technical decisions

A client-server tool in Python reproduces the capture-and-exfiltration cycle at small scale, purely as an activity generator for the lab.

The deliverable is not the tool but the inventory it produces: outbound traffic, resource access and persistence mechanisms, each tied to a control that stops it and to the evidence that backs it.

## Architecture

A closed lab, with no route to the internet and a snapshot taken beforehand. The observed machine and the one receiving the data sit in the same isolated segment, so all traffic between them can be captured and read.

That arrangement is what makes the exercise measurable: what is touched on the filesystem, what connection is opened and when, and what is written to survive a reboot.

## Result

The inventory is ordered by the point in the system where each control acts: filesystem, network and startup mechanism. Every indicator sits next to the control that cuts it and next to the evidence supporting it, taken from the lab itself.

It is a document that can be checked, because every line points back to a concrete observation rather than to a general recommendation.

## What I learned

The most useful signals were not the network ones, because an encrypted channel hides them. They were the filesystem and the persistence mechanism.

A network control on its own would not have detected the exercise. Detection came from correlating local access with an outbound connection, which is exactly what a single observation point cannot see.
