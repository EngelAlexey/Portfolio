---
slug: analisis-spyware
title: Spyware analysis | Signals and countermeasures
tagline: The spyware is built so it can be watched in an isolated lab, and the countermeasures come out of that trace, each one next to the indicator that triggers it.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Analysis and countermeasures
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

An IT Security I course. An individual exercise: build a tool that reproduces the capture-and-exfiltration cycle, run it inside an isolated lab, and document the trace it leaves.

## Problem

The course asked for countermeasures derived from direct observation rather than from a manual.

A memorised list does not say which of them works. To know what to watch and where in the system, you first have to see what records remain when capture and data egress happen.

## Technical decisions

A client-server tool in Python reproduces the capture-and-exfiltration cycle at small scale, purely as an activity generator for the lab.

The deliverable is the inventory it produces: outbound traffic, resource access and persistence mechanisms, each mapped to a control that stops it.

## Architecture

A closed lab, with no internet route and a snapshot taken first. The observed machine and the receiving machine sit in the same isolated segment, so all traffic between them can be captured and read.

That arrangement is what makes the exercise measurable: what is touched on the filesystem, which connection opens and when, and what is written to survive a reboot.

## Result

The inventory is ordered by the point in the system where each control acts: filesystem, network and boot mechanism. Every indicator sits beside the control that stops it and beside the evidence backing it, taken from the lab itself.

## What I learned

The most useful signals were not the network ones, because an encrypted channel hides them. They were the filesystem signals and the persistence mechanism.

A network control on its own would not have detected the exercise. Detection came from correlating local access with an outbound connection, which is exactly what a single observation point cannot see.
