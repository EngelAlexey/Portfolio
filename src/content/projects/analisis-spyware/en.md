---
slug: analisis-spyware
title: Spyware analysis in a controlled environment
tagline: A client-server tool in an isolated lab to study data capture and exfiltration, and derive the countermeasures from it.
areas: [seguridad]
kind: academico
org: Universidad Técnica Nacional
role: Individual
period:
  start: '2026'
  end: '2026'
tier: ficha
home: true
visibility: publico
repo: null
demo: null
stack:
  - Python
  - Client-server
  - Malware analysis
cover: null
order: 3
---

## Context

Information Security course. An individual exercise, built and run in an isolated lab, with an academic goal: to understand an attack vector well enough to defend against it.

## Problem

Countermeasures learned by rote do not hold. To know what signals spyware leaves and which controls actually cut it off, you first have to watch how it captures and moves data.

## Technical decisions

A client-server tool in Python that reproduces, in miniature, the capture-and-exfiltration cycle. The point is not the tool: it is the list of signals it leaves behind — outbound traffic, resource access, persistence — and the mapping of each one to a control that stops it.

## Outcome

An inventory of indicators and countermeasures drawn from direct observation, not from a manual: what to watch, where, and which control closes each step of the attack.

## What I learned

That understanding the vector is what lets you defend against it. The offensive exercise was the means; the real deliverable was the defence.
